import os
import dotenv
dotenv.load_dotenv()
from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_cors import CORS
from Models import db, Post, User
from datetime import timedelta
import cloudinary
import cloudinary.uploader
from cloudinary_config import configure_cloudinary
import json
import requests
import oauthlib.oauth2

# Load environment variables

# Initialize app
app = Flask(__name__)

# CORS setup to support both local and deployed frontend
CORS(app, resources={r"/api/*": {"origins": [
    "*",
    #"http://localhost:3000",
    # Comment out Render domain
    # "https://one20eaststate3-frontend.onrender.com"
    # Add Heroku domains
    #"https://120eaststate3-frontend.herokuapp.com",
    #"https://one20es-frontend-ea37035e8ebf.herokuapp.com"
]}}, supports_credentials=True)

print("CORS allowed origins:", os.getenv("FRONTEND_ORIGIN"))


# Session config
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# Cloudinary config
configure_cloudinary()

# OAuth configuration
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
oauth_client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

# Database config
# Handle Heroku PostgreSQL URL format
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print("Using database:", app.config['SQLALCHEMY_DATABASE_URI'])

db.init_app(app)
with app.app_context():
    # Create tables if they don't exist
    try:
        db.create_all()
    except Exception as e:
        print(f"Error creating tables: {e}")
        # Continue execution even if table creation fails


# API Routes
# Authentication helper function
def get_current_user():
    if 'user_info' not in session:
        print("oops")
        return None
    user_info = session['user_info']
    user = User.query.filter_by(google_id=user_info['sub']).first()
    if not user:
        user = User(
            google_id=user_info['sub'],
            email=user_info['email'],
            name=user_info['name'],
            profile_pic=user_info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    return user

@app.route('/api/auth/login', methods=['GET'])
def login():
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
    authorization_endpoint = google_provider_cfg['authorization_endpoint']
    redirect_uri = url_for('callback', _external=True)
    request_uri = oauth_client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=['openid', 'email', 'profile'],
    )
    return jsonify({'redirect_url': request_uri})

@app.route('/api/auth/login/callback', methods=['GET'])
def callback():
    code = request.args.get('code')
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
    token_endpoint = google_provider_cfg['token_endpoint']
    token_url, headers, body = oauth_client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        timeout=5
    )
    oauth_client.parse_request_body_response(json.dumps(token_response.json()))
    userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
    uri, headers, body = oauth_client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body, timeout=5)
    if userinfo_response.json().get('email_verified'):
        session['user_info'] = userinfo_response.json()
        get_current_user()
        return redirect(os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000"))
    else:
        return jsonify({'error': 'User email not verified by Google'}), 400

@app.route('/api/auth/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/user', methods=['GET'])
def get_user():
    user = get_current_user()
    if user:
        if user.email == 'hl3547@princeton.edu':
            user.role = 'admin'

        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'profile_pic': user.profile_pic,
                'role': user.role
            }
        })
    else:
        return jsonify({'authenticated': False})

@app.route('/api/posts', methods=['GET', 'POST', 'OPTIONS'])  # Add 'GET' here
def handle_message():
    if request.method == 'OPTIONS':
        return '', 204  # Preflight response
    
    elif request.method == 'GET':
        # Retrieve all posts from the database
        try:
            posts = Post.query.filter_by(status='approved').all()
            return jsonify([{
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'tag': post.tag,
                'image_url': post.image_url,
                'video_url': post.video_url,
                'date_created': post.date_created,
                'user_id': post.user_id,
                'author': post.user.name if post.user else 'Anonymous',
                'profile_pic': post.user.profile_pic if post.user else None,
                'status': post.status
            } for post in posts])
        except Exception as e:
            print(f"Error fetching posts: {e}")
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        # Your existing POST handling logic
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        # Handle form data instead of JSON
        try:
            title = request.form.get('title')
            content = request.form.get('content')
            tag = request.form.get('tag')
            
            if not title or not content:
                return jsonify({'error': 'Title and content are required'}), 400

            image_url = None
            video_url = None
            
            # Handle file uploads
            if 'image' in request.files:
                image_file = request.files['image']
                if image_file.filename != '':
                    upload_result = cloudinary.uploader.upload(
                        image_file,
                        folder="120EastState3",
                        resource_type="auto"
                    )
                    image_url = upload_result.get('secure_url')

            if 'video' in request.files:
                video_file = request.files['video']
                if video_file.filename != '':
                    upload_result = cloudinary.uploader.upload(
                        video_file,
                        folder="120EastState3/videos",
                        resource_type="video"
                    )
                    video_url = upload_result.get('secure_url')

            new_post = Post(
                title=title,
                content=content,
                tag=tag,
                image_url=image_url,
                video_url=video_url,
                user_id=user.id,
                status='pending'
            )
            
            db.session.add(new_post)
            db.session.commit()
            
            return jsonify({
                'message': 'Post added successfully!',
                'post': {
                    'id': new_post.id,
                    'title': title,
                    'content': content,
                    'tag': tag,
                    'image_url': image_url,
                    'video_url': video_url
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error occurred: {e}")
            return jsonify({'error': str(e)}), 500
        
@app.route('/api/user/posts', methods=['GET'])
def get_user_posts():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
    
    try:
        user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_created.desc()).all()
        return jsonify([{
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'tag': post.tag,
            'image_url': post.image_url,
            'video_url': post.video_url,
            'date_created': post.date_created,
            'status': post.status
        } for post in user_posts])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    # Handle preflight request for CORS
    if request.method == 'OPTIONS':
        return '', 204  # Empty response with 204 (No Content) status
    # Check if user is authenticated
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        # Determine file type (video or image)
        file_type = 'image'
        if file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')):
            file_type = 'video'
        
        # Set appropriate resource type and folder
        resource_type = "video" if file_type == 'video' else "auto"
        folder = "120EastState3/videos" if file_type == 'video' else "120EastState3"
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type=resource_type
        )
        
        # Return the appropriate URL based on file type
        if file_type == 'video':
            return jsonify({
                'success': True,
                'video_url': upload_result.get('secure_url')
            })
        else:
            return jsonify({
                'success': True,
                'image_url': upload_result.get('secure_url')
            })
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/pending-posts', methods=['GET'])
def get_pending_posts():
    #user = get_current_user()
    #if not user or user.role != 'admin':
        #return jsonify({'error': 'Unauthorized'}), 403
    
    pending_posts = Post.query.filter_by(status='pending').all()
    return jsonify([{
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'tag': post.tag,
        'image_url': post.image_url,
        'video_url': post.video_url,
        'date_created': post.date_created,
        'user_id': post.user_id,
        'author': post.user.name if post.user else 'Anonymous',
        'profile_pic': post.user.profile_pic if post.user else None,
        'status': post.status
    } for post in pending_posts])

@app.route('/api/admin/posts/<int:post_id>/approve', methods=['POST'])
def approve_post(post_id):
    return update_post_status(post_id, 'approved')

@app.route('/api/admin/posts/<int:post_id>/deny', methods=['POST'])
def deny_post(post_id):
    return update_post_status(post_id, 'denied')

def update_post_status(post_id, new_status):
    #user = get_current_user()
    #if not user or user.role != 'admin':
        #return jsonify({'error': 'Unauthorized'}), 403
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    post.status = new_status
    db.session.commit()
    return jsonify({'message': f'Post {new_status} successfully'})

if __name__ == '__main__':
    app.run(debug=True, port=5001)




# This route was removed to avoid conflicts with the Google auth login route


"""       
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/ContactUs')
def contact():
    return render_template("contact.html")
"""
# API endpoint to get all archive items
"""
@app.route('/api/items', methods=['GET'])
def get_items():
    items = ArchiveItem.query.all()
    return jsonify([
        {'id': item.id, 'title': item.title, 'description': item.description}
        for item in items
    ])
"""

