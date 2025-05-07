#!/usr/bin/env python
#-----------------------------------------------------------------------
# App.py
# Author: Andrew Cho, Brian Seo, Henry Li
#-----------------------------------------------------------------------

import os
from datetime import datetime, UTC

# Third-party imports
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from flask import Flask, jsonify, request    
from flask_cors import CORS
from database import db, Post, User, Tag, Media, Announcement
from cloudinary_config import configure_cloudinary
from email_functions import send_decision_email, send_contact_form_email
from auth import auth_bp, jwt_required, require_roles, get_current_user

#-----------------------------------------------------------------------

# Load environment variables
load_dotenv()

# Initialize app
app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET')

# CORS setup to support both local and heroku deployment
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5001", 
    "https://one20es-frontend-ea37035e8ebf.herokuapp.com",
    "https://one20es-backend-bd090d21d298.herokuapp.com",
    "https://one20es-archive-b05baf7b3364.herokuapp.com"
]

CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "supports_credentials": True
    }
})

# Cloudinary configuration
configure_cloudinary()

# Database configuration
database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Register auth blueprint
app.register_blueprint(auth_bp)

#=======================================================================
# API Routes
#=======================================================================

#-----------------------------------------------------------------------
# Posts Routes
#-----------------------------------------------------------------------

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
            'date_created': post.date_created,
            'user_id': post.user_id,
            'author': post.user.name if post.user else 'Anonymous',
            'profile_pic': post.user.profile_pic if post.user else None,
            'status': post.status,
            'media': [{
                'id': media.id,
                'url': media.url,
                'media_type': media.media_type,
                'public_id': media.public_id,
                'filename': media.filename,
                'caption': media.caption
            } for media in Media.query.filter_by(post_id=post.id).all()]
        } for post in posts])
    except Exception as e:
        return jsonify({'error': f'Error fetching posts by tag: {str(e)}'}), 500
    
# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "This page doesn't exist"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# Public route for getting posts - no authentication required
@app.route('/api/posts', methods=['GET'])
def get_public_posts():
    """Get all approved posts - public route, no authentication required
    
    Methods:
        GET: Retrieve all approved posts
        
    Returns:
        GET: JSON array of all approved posts
    """
    
    # Handle GET request - return all approved posts
    try:
        posts = Post.query.filter_by(status='approved').order_by(Post.date_created.desc()).all()
        return jsonify([{
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'tag': post.tag,
            'date_created': post.date_created,
            'user_id': post.user_id,
            'author': post.user.name if post.user else 'Anonymous',
            'profile_pic': post.user.profile_pic if post.user else None,
            'status': post.status,
            'media': [{
                'id': media.id,
                'url': media.url,
                'media_type': media.media_type,
                'public_id': media.public_id,
                'filename': media.filename,
                'caption': media.caption
            } for media in Media.query.filter_by(post_id=post.id).all()]
        } for post in posts])
    except Exception as e:
        return jsonify({'error': f'Error fetching posts: {str(e)}'}), 500

# Protected route for creating posts - requires authentication
@app.route('/api/posts', methods=['POST'])
@jwt_required
def create_post():
    """Create a new post - protected route, requires authentication
    
    Methods:
        POST: Create a new post with optional media attachments
        
    Returns:
        POST: JSON with new post details and confirmation message
    """
    
    # Only handle POST requests in this route
    
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

        # Create and save the new post
        new_post = Post(
            title=title,
            content=content,
            tag=tag,
            user_id=user.id,
            status='pending'
        )
        
        db.session.add(new_post)
        db.session.flush()  # Flush to get the new post ID without committing transaction
        
        # Process media uploads (up to 5 files)
        media_files = []
        media_count = 0
        max_files = 5  # Maximum allowed files
        
        # Process all media files in the request
        # Look for media files with names in format 'media_0', 'media_1', etc.
        for i in range(max_files):
            media_key = f'media_{i}'
            if media_key in request.files and media_count < max_files:
                file = request.files[media_key]
                if file and file.filename != '':
                    try:
                        filename = file.filename
                        # Determine resource type based on file extension
                        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                        
                        # Determine media type and resource type for Cloudinary
                        if file_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff']:
                            media_type = 'image'
                            resource_type = 'image'
                            folder = "120EastState3/images"
                        elif file_ext in ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']:
                            media_type = 'video'
                            resource_type = 'video'
                            folder = "120EastState3/videos"
                        elif file_ext in ['mp3', 'wav', 'ogg', 'aac', 'flac']:
                            media_type = 'audio'
                            resource_type = 'video'  # Cloudinary uses 'video' resource type for audio
                            folder = "120EastState3/audio"
                        else:
                            media_type = 'document'
                            resource_type = 'raw'  # Use 'raw' for documents instead of 'auto'
                            folder = "120EastState3/documents"
                        
                        # Get caption if provided
                        caption = request.form.get(f"{media_key}_caption", "")
                        
                        # Upload to Cloudinary
                        upload_result = cloudinary.uploader.upload(
                            file,
                            folder=folder,
                            resource_type=resource_type
                        )
                        
                        secure_url = upload_result.get('secure_url')
                        public_id = upload_result.get('public_id')
                        
                        if not secure_url:
                            continue  # Skip if upload failed
                        
                        # Create media record
                        media = Media(
                            post_id=new_post.id,
                            url=secure_url,
                            media_type=media_type,
                            public_id=public_id,
                            filename=filename,
                            caption=caption
                        )
                        db.session.add(media)
                        
                        # Add to response data
                        media_files.append({
                            'url': secure_url,
                            'media_type': media_type,
                            'filename': filename,
                            'public_id': public_id,
                            'caption': caption
                        })
                        
                        media_count += 1
                    except Exception as upload_error:
                        print(f"Error uploading {file.filename}: {str(upload_error)}")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Post added successfully! It will be visible after approval.',
            'post': {
                'id': new_post.id,
                'title': title,
                'content': content,
                'tag': tag,
                'media': [{
                    'id': media.id,
                    'url': media.url,
                    'media_type': media.media_type,
                    'public_id': media.public_id,
                    'filename': media.filename,
                    'caption': media.caption
                } for media in Media.query.filter_by(post_id=new_post.id).all()]
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating post: {str(e)}'}), 500

@app.route('/api/user/posts', methods=['GET'])
@jwt_required
def get_user_posts():
    user = get_current_user()
    try:
        posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_created.desc()).all()
        
        result = []
        for post in posts:
            post_data = {
                'id': post.id,
                'title': post.title,
                'content': post.content,
                'tag': post.tag,
                'author': user.name,
                'profile_pic': user.profile_pic,
                'status': post.status,
                'date_created': post.date_created,
                'media': [{
                    'id': media.id,
                    'url': media.url,
                    'media_type': media.media_type,
                    'public_id': media.public_id,
                    'filename': media.filename,
                    'caption': media.caption
                } for media in Media.query.filter_by(post_id=post.id).all()]
            }
            result.append(post_data)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'An error occurred while fetching your posts'
        }), 500
    
@app.route('/api/upload', methods=['POST'])
@jwt_required
def upload_file():
    """Upload a file (image or video) to Cloudinary
    
    Methods:
        POST: Upload a file and receive a URL
        
    Returns:
        POST: JSON with the URL of the uploaded file
    """
    # Current user is already verified by @jwt_required
    user = get_current_user()
        
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
        'date_created': post.date_created,
        'user_id': post.user_id,
        'author': post.user.name if post.user else 'Anonymous',
        'profile_pic': post.user.profile_pic if post.user else None,
        'status': post.status,
        'media': [{
            'id': media.id,
            'url': media.url,
            'media_type': media.media_type,
            'public_id': media.public_id,
            'filename': media.filename,
            'caption': media.caption
        } for media in Media.query.filter_by(post_id=post.id).all()]
    } for post in pending_posts])

@app.route('/api/admin/denied-posts', methods=['GET'])
@require_roles('admin')
def get_denied_posts():
    """Get all pending posts that need admin approval
    
    This endpoint is restricted to users with 'admin' role
    
    Returns:
        JSON array of all pending posts
    """
    pending_posts = Post.query.filter_by(status='denied').all()
    return jsonify([{
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'tag': post.tag,
        'date_created': post.date_created,
        'user_id': post.user_id,
        'author': post.user.name if post.user else 'Anonymous',
        'profile_pic': post.user.profile_pic if post.user else None,
        'status': post.status,
        'media': [{
            'id': media.id,
            'url': media.url,
            'media_type': media.media_type,
            'public_id': media.public_id,
            'filename': media.filename,
            'caption': media.caption
        } for media in Media.query.filter_by(post_id=post.id).all()]
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
    # Get the feedback from the request body if available
    feedback = request.json.get('feedback', None) if request.json else None
    return update_post_status(post_id, 'denied', feedback)

@app.route('/api/admin/posts/<int:post_id>/edit', methods=['PUT'])
@require_roles('admin')
def edit_post_admin(post_id):
        
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
        
    try:

        data = request.json
        
        # Update post fields if provided in request
        if 'title' in data:
            post.title = data['title']
        if 'content' in data:
            post.content = data['content']
        if 'tag' in data:
            post.tag = data['tag']
            
        # Save changes
        db.session.commit()
        
        # Return updated post data
        return jsonify({
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'tag': post.tag,
            'date_created': post.date_created,
            'user_id': post.user_id,
            'author': post.user.name if post.user else 'Anonymous',
            'profile_pic': post.user.profile_pic if post.user else None,
            'status': post.status,
            'media': [{
                'id': media.id,
                'url': media.url,
                'media_type': media.media_type,
                'public_id': media.public_id,
                'filename': media.filename,
                'caption': media.caption
            } for media in Media.query.filter_by(post_id=post.id).all()]
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating post: {str(e)}'}), 500
    
@app.route('/api/admin/posts/<int:post_id>', methods=['DELETE'])
@require_roles('admin')
def delete_post_admin(post_id):

    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({'message': 'Post deleted successfully by admin'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting post: {str(e)}'}), 500
        
@app.route('/api/user/posts/<int:post_id>', methods=['DELETE'])
@jwt_required
def delete_user_post(post_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    post = Post.query.filter_by(id=post_id, user_id=user.id).first()
    if not post:
        return jsonify({'error': 'Post not found or not authorized'}), 404

    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({'message': 'Post deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error deleting post: {str(e)}'}), 500

@app.route('/api/posts/<int:post_id>', methods=['GET'])
def get_post_by_id(post_id):
    try:
        # Check if user is authenticated (has a valid JWT)
        user = get_current_user()
                
        # If admin, allow access to all statuses
        if user and user.role == 'admin':
            post = db.session.get(Post, post_id)
        else:
            # For non-admins and unauthenticated users, only show approved posts
            post = db.session.query(Post).filter_by(status='approved', id=post_id).first()

        if not post:
            return jsonify({'error': 'Post not found'}), 404

        return jsonify({
            'id': post.id,
            'title': post.title,
            'content': post.content,
            'tag': post.tag,
            'date_created': post.date_created,
            'user_id': post.user_id,
            'author': post.user.name if post.user else 'Anonymous',
            'profile_pic': post.user.profile_pic if post.user else None,
            'status': post.status,
            'media': [{
                'id': media.id,
                'url': media.url,
                'media_type': media.media_type,
                'public_id': media.public_id,
                'filename': media.filename,
                'caption': media.caption
            } for media in Media.query.filter_by(post_id=post.id).all()]
        })

    except Exception as e:
        return jsonify({'error': f'Error fetching post: {str(e)}'}), 500

@require_roles('admin')
def update_post_status(post_id, new_status, feedback=None):
    """Update the status of a post
    
    This is a helper function for approve_post and deny_post
    
    Args:
        post_id: The ID of the post to update
        new_status: The new status ('approved' or 'denied')
        feedback: Optional feedback text for denied posts
        
    Returns:
        JSON response with success message or error
    """
    post = db.session.get(Post, post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    # Get the user who created the post
    user = db.session.get(User, post.user_id)
    
    # Update the post status
    post.status = new_status
    db.session.commit()
    
    # Send an email notification if we have a user email
    if user and user.email:
        try:
            # Include feedback in denial emails
            email_sent = send_decision_email(user.email, new_status, post.title, feedback)
            email_status = "sent" if email_sent else "failed to send"
        except Exception as e:
            # Don't fail the whole request if email fails
            email_status = f"failed with error: {str(e)}"
    else:
        email_status = "skipped (no user email)"
    
    return jsonify({
        'message': f'Post {new_status} successfully',
        'post_id': post_id,
        'status': new_status,
        'email_notification': email_status
    })

# -----------------------------------------------------------------------
# Tags Routes
# -----------------------------------------------------------------------

@app.route('/api/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.order_by(Tag.display_order).all()
    return jsonify([{'id': t.id, 'name': t.name, 'display_order': t.display_order, 'image_url': t.image_url} for t in tags])

@app.route('/api/admin/tags', methods=['POST'])
@require_roles('admin')
def create_tag():
    data = request.json
    new_tag = Tag(
        name=data.get('name'),
        display_order=data.get('display_order', 0),
        image_url=data.get('image_url')
    )
    db.session.add(new_tag)
    db.session.commit()
    return jsonify({'id': new_tag.id, 'name': new_tag.name, 'display_order': new_tag.display_order, 'image_url': new_tag.image_url}), 201

@app.route('/api/admin/tags/<int:tag_id>', methods=['PUT'])
@require_roles('admin')
def update_tag(tag_id):
    tag = db.session.get(Tag, tag_id)
    if not tag:
        return jsonify({'error': 'Tag not found'}), 404
    
    data = request.json
    old_name = tag.name  # Save old name
    new_name = data.get('name', tag.name)
    
    tag.name = new_name
    tag.display_order = data.get('display_order', tag.display_order)
    tag.image_url = data.get('image_url', tag.image_url)
    
    try:
        db.session.commit()
        
        # Now update all posts that had the old tag name
        Post.query.filter_by(tag=old_name).update({Post.tag: new_name})
        db.session.commit()
        
        return jsonify({
            'id': tag.id,
            'name': tag.name,
            'display_order': tag.display_order,
            'image_url': tag.image_url
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating tag and posts: {str(e)}'}), 500


@app.route('/api/admin/tags/<int:tag_id>', methods=['DELETE'])
@require_roles('admin')
def delete_tag(tag_id):
    tag = db.session.get(Tag, tag_id)
    if not tag:
        return jsonify({'error': 'Tag not found'}), 404
    db.session.delete(tag)
    db.session.commit()
    return jsonify({'message': f'Tag {tag_id} deleted'})

#-----------------------------------------------------------------------
# Contact Form Routes (Does not require authentication)
#-----------------------------------------------------------------------

@app.route('/api/about/contact', methods=['POST'])
def send_message():
    try:
        data = request.json
        name = data["name"]
        sender_email = data["email"]
        message_content = data["message"]
        
        # Send email to organization email
        try:
            # Use cho.s.andy03@gmail.com directly for testing
            org_email = "120eaststate@gmail.com"  # Hardcoded for testing. Change to Organizational email when ready.
            print(f"Attempting to send email to: {org_email}")
            
            # Debug environment variables
            print(f"EMAIL_USER: {os.getenv('EMAIL_USER')}")
            print(f"APP_PASS exists: {bool(os.getenv('APP_PASS'))}")
            
            # Use the contact form email function
            email_sent = send_contact_form_email(
                to_email=org_email,
                name=name,
                email=sender_email,
                message=message_content
            )
            
            if email_sent:
                print(f"Contact form email sent to {org_email}")
            else:
                print(f"Failed to send contact form email to {org_email}, but message was saved to database")
        except Exception as email_error:
            print(f"Failed to send email: {str(email_error)}")
            # We still return success even if email fails since the message was saved to database
        
        return jsonify({'message': 'Message submitted successfully'}), 201
    except Exception as e:
        print(f"Error in contact form: {str(e)}")
        return jsonify({'error': 'Error processing message'}), 500

# -----------------------------------------------------------------------
# User Routes
# -----------------------------------------------------------------------
@app.route('/api/admin/users', methods=['GET'])
@require_roles('admin')
def get_all_users():
    """Get all users for admin dashboard
    
    This endpoint is restricted to users with 'admin' role
    
    Returns:
        JSON array of all users with their role information
    """
    try:
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'profile_pic': user.profile_pic,
            'role': user.role,  # Will be 'admin' or None/default
            'date_joined': user.date_created
        } for user in users])
    except Exception as e:
        return jsonify({'error': f'Error fetching users: {str(e)}'}), 500

# -----------------------------------------------------------------------
# Announcement Routes
# -----------------------------------------------------------------------
# Public route for getting announcements - no authentication required
@app.route('/api/announcements', methods=['GET'])
def get_public_announcements():
    """Get all active announcements - public route, no authentication required
    
    Methods:
        GET: Retrieve all active announcements
        
    Returns:
        GET: JSON array of all active announcements
    """
    
    # Get current datetime for filtering expired announcements
    try:
        current_time = datetime.now(UTC)
        
        # Query for active announcements that are either not expired or don't have an expiration date
        announcements = Announcement.query.filter(
            Announcement.is_active == True,
            Announcement.date_start <= current_time,
            # Either no expiration date (date_end is None) or expiration date is in the future
            (Announcement.date_end.is_(None) | (Announcement.date_end >= current_time))
        ).order_by(Announcement.date_created.desc()).all()
        
        result = [{
            'id': announcement.id,
            'title': announcement.title,
            'content': announcement.content,
            'date_created': announcement.date_created,
            'date_start': announcement.date_start,
            'date_end': announcement.date_end,
            'is_active': announcement.is_active,
            'user': {
                'id': announcement.user.id,
                'name': announcement.user.name,
                'profile_pic': announcement.user.profile_pic
            } if announcement.user else None
        } for announcement in announcements]
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Error fetching announcements: {str(e)}'}), 500

# Protected route for creating announcements - requires admin authentication
@app.route('/api/announcements', methods=['POST', 'OPTIONS'])
@jwt_required
def create_announcement():
    """Create a new announcement - protected route, requires admin authentication
    
    Methods:
        POST: Create a new announcement (admin only)
    
    Returns:
        POST: JSON with new announcement details
    """
    # Check if user is admin - get current user from token
    current_user = get_current_user()
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        data = request.json
        
        # Required fields
        title = data.get('title')
        content = data.get('content')
        date_start = data.get('date_start')
        
        # Optional fields
        date_end = data.get('date_end')  # Can be null for no expiration
        
        if not title or not content or not date_start:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Convert string dates to datetime objects
        try:
            date_start = datetime.fromisoformat(date_start.replace('Z', '+00:00'))
            if date_end:
                date_end = datetime.fromisoformat(date_end.replace('Z', '+00:00'))
            else:
                date_end = None  # No expiration date
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Create new announcement
        new_announcement = Announcement(
            user_id=current_user.id,
            title=title,
            content=content,
            date_start=date_start,
            date_end=date_end,
            is_active=True
        )
        
        db.session.add(new_announcement)
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': {
                'id': new_announcement.id,
                'title': new_announcement.title,
                'content': new_announcement.content,
                'date_created': new_announcement.date_created,
                'date_start': new_announcement.date_start,
                'date_end': new_announcement.date_end,
                'is_active': new_announcement.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating announcement: {str(e)}'}), 500

@app.route('/api/announcements/<int:announcement_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_single_announcement(announcement_id):
    """Handle operations on a single announcement
    
    Methods:
        GET: Retrieve a specific announcement
        PUT: Update an announcement (admin only)
        DELETE: Delete an announcement (admin only)
    
    Args:
        announcement_id: The ID of the announcement to operate on
    
    Returns:
        GET: JSON with announcement details
        PUT: JSON with updated announcement details
        DELETE: JSON confirmation message
    """
    # Get the announcement
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({'error': 'Announcement not found'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'id': announcement.id,
            'title': announcement.title,
            'content': announcement.content,
            'date_created': announcement.date_created,
            'date_start': announcement.date_start,
            'date_end': announcement.date_end,
            'is_active': announcement.is_active,
            'user': {
                'id': announcement.user.id,
                'name': announcement.user.name,
                'profile_pic': announcement.user.profile_pic
            } if announcement.user else None
        })
    
    # Check if user is admin for PUT and DELETE operations
    current_user = get_current_user()
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if request.method == 'PUT':
        try:
            data = request.json
            
            # Update fields if provided in the request
            if 'title' in data:
                announcement.title = data['title']
            if 'content' in data:
                announcement.content = data['content']
            if 'date_start' in data:
                try:
                    announcement.date_start = datetime.fromisoformat(data['date_start'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'error': 'Invalid date_start format'}), 400
            if 'date_end' in data:
                if data['date_end']:
                    try:
                        announcement.date_end = datetime.fromisoformat(data['date_end'].replace('Z', '+00:00'))
                    except ValueError:
                        return jsonify({'error': 'Invalid date_end format'}), 400
                else:
                    announcement.date_end = None  # Remove expiration date
            if 'is_active' in data:
                announcement.is_active = bool(data['is_active'])
            
            db.session.commit()
            
            return jsonify({
                'message': 'Announcement updated successfully',
                'announcement': {
                    'id': announcement.id,
                    'title': announcement.title,
                    'content': announcement.content,
                    'date_created': announcement.date_created,
                    'date_start': announcement.date_start,
                    'date_end': announcement.date_end,
                    'is_active': announcement.is_active
                }
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error updating announcement: {str(e)}'}), 500
    
    elif request.method == 'DELETE':
        try:
            db.session.delete(announcement)
            db.session.commit()
            
            return jsonify({
                'message': 'Announcement deleted successfully',
                'id': announcement_id
            })
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Error deleting announcement: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)