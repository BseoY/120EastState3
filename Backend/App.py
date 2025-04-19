# Standard library imports
import os
import json
from datetime import timedelta
from functools import wraps

# Third-party imports
import dotenv
import requests
import cloudinary
import cloudinary.uploader
import oauthlib.oauth2
from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from flask_cors import CORS

# Local imports
from Models import db, Post, User, ContactMessage
from cloudinary_config import configure_cloudinary

# Load environment variables
dotenv.load_dotenv()

# Initialize app
app = Flask(__name__)

# CORS setup to support both local and deployed frontend
allowed_origins = [
    "http://localhost:3000", 
    "https://one20es-frontend-ea37035e8ebf.herokuapp.com"
]

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "supports_credentials": True
    }
})

# Determine what frontend origin to use
def get_frontend_origin():
    env = os.getenv("ENV")
    if env == "production":
        return "https://one20es-frontend-ea37035e8ebf.herokuapp.com"
    else:
        return "http://localhost:3000"

@app.after_request
def after_request(response):
    """Ensure no duplicate CORS headers in responses"""
    if 'Access-Control-Allow-Origin' in response.headers:
        origin = request.headers.get('Origin')
        if origin and origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
    return response


    
# Session configuration
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True

# Cloudinary configuration
configure_cloudinary()

# OAuth configuration
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Only for development
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
oauth_client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

# Database configuration
# Handle Heroku PostgreSQL URL format
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Error creating tables: {e}")
        # Continue execution even if table creation fails

# API Routes

@app.route('/api/posts/tag/<string:tag>', methods=['GET'])
def get_posts_by_tag(tag):
    """Get all approved posts with a specific tag
    
    Args:
        tag: The tag to filter posts by
        
    Returns:
        JSON array of posts with the specified tag
    """
    try:
        posts = Post.query.filter_by(status='approved', tag=tag).order_by(Post.date_created.desc()).all()
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
        return jsonify({'error': f'Error fetching posts by tag: {str(e)}'}), 500
    
# Authentication Helper Functions
def get_current_user():
    """Get the current authenticated user or create a new user if not exists"""
    if 'user_info' not in session:
        return None

    user_info = session['user_info']
    user = User.query.filter_by(google_id=user_info['sub']).first()

    # Set admin role for users with specific email domains
    admin_domains = ['@princeton.edu', '@120eaststate.org']
    
    if user and any(user.email.endswith(domain) for domain in admin_domains):
        user.role = 'admin'

    # Create new user if not exists
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
    """Initiate Google OAuth login flow"""
    # 1) Read where the front-end wants to go back to
    return_to = request.args.get('returnTo')
    if return_to:
        session['return_to'] = return_to
    
    # 2) Build the Google OAuth URL, embedding state
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
    authorization_endpoint = google_provider_cfg['authorization_endpoint']
    redirect_uri = url_for('callback', _external=True)
    request_uri = oauth_client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=['openid', 'email', 'profile'],
        state=return_to  # Mirror the return_to in OAuth state parameter
    )
    return jsonify({'redirect_url': request_uri})

@app.route('/api/tags', methods=['GET'])
def get_all_tags():
    """Get all unique tags from approved posts
    
    Returns:
        JSON array of unique tags
    """
    try:
        tags = db.session.query(Post.tag).filter(
            Post.status == 'approved',
            Post.tag.isnot(None)
        ).distinct().all()
        return jsonify([tag[0] for tag in tags])
    except Exception as e:
        return jsonify({'error': f'Error fetching tags: {str(e)}'}), 500
    
@app.route('/api/auth/login/callback', methods=['GET'])
def callback():
    """Handle Google OAuth callback and authenticate user"""
    try:
        # Get authorization code from request
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400
            
        # Get token endpoint from Google's discovery document
        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        token_endpoint = google_provider_cfg['token_endpoint']
        
        # Prepare token request
        token_url, headers, body = oauth_client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=request.base_url,
            code=code
        )
        
        # Exchange code for tokens
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
            timeout=5
        )
        oauth_client.parse_request_body_response(json.dumps(token_response.json()))

        # Get user info from Google
        userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
        uri, headers, body = oauth_client.add_token(userinfo_endpoint)
        userinfo_response = requests.get(uri, headers=headers, data=body, timeout=5)

        # Verify user email and create session
        if userinfo_response.json().get('email_verified'):
            session['user_info'] = userinfo_response.json()
            
            # 1) Determine where to send them - first check state, then session
            return_to = (
                request.args.get('state')
                or session.pop('return_to', None)
            )
            
            # 2) Construct the full redirect URL
            frontend_origin = get_frontend_origin()
            target = frontend_origin
            
            if return_to:
                # Make sure return_to starts with a slash if it's a relative path
                if not return_to.startswith('/'):
                    return_to = '/' + return_to
                target = f"{frontend_origin}{return_to}"
            
            # 3) Redirect to the target URL
            return redirect(target)
            
        return jsonify({'error': 'User email not verified by Google.'}), 400
        
    except Exception as e:
        return jsonify({'error': f'Authentication error: {str(e)}'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Log out the current user by clearing their session"""
    session.pop('user_info', None)
    return jsonify({'success': True, 'message': 'Successfully logged out'})

# function for role vertification       
def require_roles(*required_roles):
    """Decorator to restrict route access to users with specific roles
    
    Args:
        *required_roles: A list of role names that are allowed to access the route
        
    Returns:
        Function decorator that checks user roles before allowing access
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            
            if user.role not in required_roles:
                return jsonify({'error': 'Unauthorized: insufficient privileges'}), 403
                
            return f(*args, **kwargs)
        return wrapper
    return decorator

@app.route('/api/auth/user', methods=['GET'])
def get_user():
    """Get current authenticated user information
    
    Returns:
        JSON with user details if authenticated, or authentication status if not
    """
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
    """Handle post operations (create new posts and get all posts)
    
    Methods:
        GET: Retrieve all approved posts
        POST: Create a new post with optional media attachments
        OPTIONS: Handle preflight CORS requests
        
    Returns:
        GET: JSON array of all approved posts
        POST: JSON with new post details and confirmation message
        OPTIONS: Empty response for CORS preflight
    """
    if request.method == 'OPTIONS':
        return '', 204  # Preflight response
    
    elif request.method == 'GET':
        # Retrieve all approved posts from the database
        try:
            posts = Post.query.filter_by(status='approved').order_by(Post.date_created.desc()).all()
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
            return jsonify({'error': f'Error fetching posts: {str(e)}'}), 500
    
    elif request.method == 'POST':
        # Create a new post
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401

        # Process form data
        try:
            title = request.form.get('title')
            content = request.form.get('content')
            tag = request.form.get('tag')
            
            if not title or not content:
                return jsonify({'error': 'Title and content are required'}), 400

            image_url = None
            video_url = None
            
            # Handle image upload
            if 'image' in request.files:
                image_file = request.files['image']
                if image_file.filename != '':
                    upload_result = cloudinary.uploader.upload(
                        image_file,
                        folder="120EastState3",
                        resource_type="auto"
                    )
                    image_url = upload_result.get('secure_url')

            # Handle video upload
            if 'video' in request.files:
                video_file = request.files['video']
                if video_file.filename != '':
                    upload_result = cloudinary.uploader.upload(
                        video_file,
                        folder="120EastState3/videos",
                        resource_type="video"
                    )
                    video_url = upload_result.get('secure_url')

            # Create and save the new post
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
                'message': 'Post added successfully! It will be visible after approval.',
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
            return jsonify({'error': f'Error creating post: {str(e)}'}), 500
        
@app.route('/api/user/posts', methods=['GET', 'OPTIONS'])
def get_user_posts():
    """Get all posts created by the current authenticated user
    
    Methods:
        GET: Retrieve posts for current user
        OPTIONS: Handle preflight CORS requests
        
    Returns:
        GET: JSON array of all posts created by the user
        OPTIONS: Response with appropriate CORS headers
    """
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'Preflight OK'})
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
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
            'date_created': post.date_created.isoformat() if post.date_created else None,
            'status': post.status
        } for post in user_posts])
    except Exception as e:
        return jsonify({'error': f'Error retrieving user posts: {str(e)}'}), 500
    
@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    """Upload a file (image or video) to Cloudinary
    
    Methods:
        POST: Upload a file and receive a URL
        OPTIONS: Handle preflight CORS requests
        
    Returns:
        POST: JSON with the URL of the uploaded file
        OPTIONS: Empty response for CORS preflight
    """
    # Handle preflight request for CORS
    if request.method == 'OPTIONS':
        return '', 204  # Empty response with 204 (No Content) status
        
    # Check if user is authenticated
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401
        
    # Validate file in request
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
        return jsonify({'error': f'Error uploading to Cloudinary: {str(e)}'}), 500

@app.route('/api/admin/pending-posts', methods=['GET'])
@require_roles('admin')
def get_pending_posts():
    """Get all pending posts that need admin approval
    
    This endpoint is restricted to users with 'admin' role
    
    Returns:
        JSON array of all pending posts
    """
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
@require_roles('admin')
def approve_post(post_id):
    """Approve a pending post
    
    This endpoint is restricted to users with 'admin' role
    
    Args:
        post_id: The ID of the post to approve
        
    Returns:
        JSON confirmation message
    """
    return update_post_status(post_id, 'approved')

@app.route('/api/admin/posts/<int:post_id>/deny', methods=['POST'])
@require_roles('admin')
def deny_post(post_id):
    """Deny a pending post
    
    This endpoint is restricted to users with 'admin' role
    
    Args:
        post_id: The ID of the post to deny
        
    Returns:
        JSON confirmation message
    """
    return update_post_status(post_id, 'denied')

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_by_id(post_id):
    """Get a specific post by its ID
    
    Args:
        post_id: The ID of the post to retrieve
        
    Returns:
        JSON with post details or 404 if not found
    """
    try:
        post = Post.query.filter_by(id=post_id, status='approved').first()
        if not post:
            return jsonify({'error': 'Post not found'}), 404
            
        return jsonify({
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
        })
    except Exception as e:
        return jsonify({'error': f'Error fetching post: {str(e)}'}), 500

@require_roles('admin')
def update_post_status(post_id, new_status):
    """Update the status of a post
    
    This is a helper function for approve_post and deny_post
    
    Args:
        post_id: The ID of the post to update
        new_status: The new status ('approved' or 'denied')
        
    Returns:
        JSON response with success message or error
    """
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
        
    post.status = new_status
    db.session.commit()
    return jsonify({
        'message': f'Post {new_status} successfully',
        'post_id': post_id,
        'status': new_status
    })

@app.route('/api/admin/messages', methods=['GET'])
def view_message():
    messages = ContactMessage.query.order_by(ContactMessage.date_created.desc()).all()
    return jsonify([
        {
            'id': m.id,
            'name': m.name,
            'email': m.email,
            'message': m.message,
            'date_created': m.date_created,
        } for m in messages
    ])

@app.route('/api/about/contact', methods=['POST'])
def send_message():
    try:
        data = request.json
        name = data["name"]
        sender_email = data["email"]
        message_content = data["message"]

        new_msg = ContactMessage(name=name, email=sender_email, message=message_content)
        db.session.add(new_msg)
        db.session.commit()
        
        return jsonify({'message': 'Message submitted successfully'}), 201
    except Exception as e:
        return jsonify('Error retrieving message'), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
