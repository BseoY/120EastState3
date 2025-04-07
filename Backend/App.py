from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_cors import CORS
from Models import db, Post, User
import os
import dotenv
from datetime import datetime, timedelta
import cloudinary
import cloudinary.uploader
from cloudinary_config import configure_cloudinary
import json
import requests
import oauthlib.oauth2

# Initialize app
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {
    "origins": [
        "http://localhost:3000",  # for local frontend dev
        os.getenv("FRONTEND_ORIGIN", "https://one20eaststate3-frontend.onrender.com")  # for deployed frontend
    ],
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}})
# Configure session
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)


# Configure Cloudinary
configure_cloudinary()

# Load environment variables
dotenv.load_dotenv()

# Allow OAuth over HTTP for development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Google OAuth Configuration
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# OAuth client setup
oauth_client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# API Routes
# Authentication helper function
def get_current_user():
    if 'user_info' not in session:
        return None
    
    user_info = session['user_info']
    # Check if user exists in database
    user = User.query.filter_by(google_id=user_info['sub']).first()
    
    if not user:
        # Create new user
        user = User(
            google_id=user_info['sub'],
            email=user_info['email'],
            name=user_info['name'],
            profile_pic=user_info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    
    return user

# Authentication routes
@app.route('/api/auth/login', methods=['GET'])
def login():
    # Determine the URL for Google login
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
    authorization_endpoint = google_provider_cfg['authorization_endpoint']
    
    # Construct the request URL for Google login
    redirect_uri = request.base_url + '/callback'
    request_uri = oauth_client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=['openid', 'email', 'profile'],
    )
    
    # Redirect to the request URL
    return jsonify({'redirect_url': request_uri})

@app.route('/api/auth/login/callback', methods=['GET'])
def callback():
    # Get the authorization code that Google sent
    code = request.args.get('code')
    
    # Determine the URL to fetch tokens
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
    token_endpoint = google_provider_cfg['token_endpoint']
    
    # Prepare token request
    token_url, headers, body = oauth_client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    
    # Fetch the tokens
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        timeout=5
    )
    
    # Parse the tokens
    oauth_client.parse_request_body_response(json.dumps(token_response.json()))
    
    # Fetch user info
    userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
    uri, headers, body = oauth_client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body, timeout=5)
    
    # Verify user info
    if userinfo_response.json().get('email_verified'):
        # Save user info in session
        session['user_info'] = userinfo_response.json()
        
        # Get or create user in database
        user = get_current_user()
        
        # Redirect to frontend
        return redirect(os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000"))
    else:
        return jsonify({'error': 'User email not verified by Google'}), 400

@app.route('/api/auth/logout', methods=['GET', 'POST'])
def logout():
    # Clear session
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/user', methods=['GET'])
def get_user():
    # Get current user
    user = get_current_user()
    
    if user:
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

@app.route('/api/posts', methods=['GET', 'POST', 'OPTIONS'])
def handle_message():
    if request.method == 'OPTIONS':
        # Handle preflight request for CORS
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Credentials', 'true')  # Allow credentials
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
        return response

    elif request.method == 'POST':
        # Check if user is authenticated
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
            
        data = request.get_json()
        # Check if title and content are provided
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Title and content are required'}), 400

        try:
            # Handle image upload if present
            image_url = None
            video_url = None
            
            # For now, just use the URLs if they're provided directly
            if 'image_url' in data and data['image_url']:
                image_url = data['image_url']
            
            if 'video_url' in data and data['video_url']:
                video_url = data['video_url']
                
            # If base64 image data is provided instead of URL
            if 'image' in data and data['image'] and not image_url:
                try:
                    # Upload image to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        data['image'],
                        folder="120EastState3",  # Organize images in a folder
                        resource_type="auto"
                    )
                    image_url = upload_result.get('secure_url')
                except Exception as e:
                    print(f"Error uploading image: {e}")
                
            # Handle video upload if present
            if 'video' in data and data['video'] and not video_url:
                try:
                    # Upload video to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        data['video'],
                        folder="120EastState3/videos",  # Organize videos in a subfolder
                        resource_type="video"
                    )
                    video_url = upload_result.get('secure_url')
                except Exception as e:
                    print(f"Error uploading video: {e}")

            # Create the new post
            new_post = Post(  # Use Post model
                title=data['title'],
                content=data['content'],
                tag=data.get('tag', None),  # Optional field
                image_url=image_url,  # Add the image URL
                video_url=video_url,   # Add the video URL
                user_id=user.id  # Associate post with user
            )
            db.session.add(new_post)
            db.session.commit()
            return jsonify({
                'message': 'Post added successfully!',
                'post': {
                    'id': new_post.id,
                    'title': new_post.title,
                    'content': new_post.content,
                    'tag': new_post.tag,
                    'image_url': new_post.image_url,
                    'video_url': new_post.video_url
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            print(f"Error occurred: {e}")  # Log the error
            return jsonify({'error': str(e)}), 500

    elif request.method == 'GET':
        # Retrieve all posts from the database
        try:
            posts = Post.query.all()  # Use Post model here
            return jsonify([{
                'id': post.id,
                'title': post.title,  # Include title
                'content': post.content,  # Include content
                'tag': post.tag,  # Include tag
                'image_url': post.image_url,  # Include image URL
                'video_url': post.video_url,  # Include video URL
                'date_created': post.date_created,
                'user_id': post.user_id,
                'author': post.user.name if post.user else 'Anonymous',
                'profile_pic': post.user.profile_pic if post.user else None  # Include user profile picture
            } for post in posts])
        except Exception as e:
            print(f"Error occurred while fetching posts: {e}")  # Log the error
            return jsonify({'error': str(e)}), 500
        

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    # Handle preflight request for CORS
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Credentials', 'true')  # Allow credentials
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
        return response
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