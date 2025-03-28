from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from Models import db, Post
import os
import dotenv
from datetime import datetime
import cloudinary
import cloudinary.uploader
from cloudinary_config import configure_cloudinary

# Initialize app
app = Flask(__name__)
CORS(app)

# Configure Cloudinary
configure_cloudinary()




# Load environment variables
dotenv.load_dotenv()

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://test1:120ES3@127.0.0.1:5432/testdb')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

# API Routes
@app.route('/api/posts', methods=['GET', 'POST', 'OPTIONS'])
def handle_message():
    if request.method == 'OPTIONS':
        # Handle preflight request for CORS
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
        return response

    elif request.method == 'POST':
        data = request.get_json()
        # Check if title and content are provided
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Title and content are required'}), 400

        try:
            # Handle image upload if present
            image_url = None
            if 'image' in data and data['image']:
                # Upload image to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    data['image'],
                    folder="120EastState3",  # Organize images in a folder
                    resource_type="auto"
                )
                image_url = upload_result.get('secure_url')

            # Create the new post
            new_post = Post(  # Use Post model
                title=data['title'],
                content=data['content'],
                tag=data.get('tag', None),  # Optional field
                image_url=image_url  # Add the image URL
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
                    'image_url': new_post.image_url
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
                'date_created':post.date_created
            } for post in posts])
        except Exception as e:
            print(f"Error occurred while fetching posts: {e}")  # Log the error
            return jsonify({'error': str(e)}), 500
        
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/ContactUs')
def contact():
    return render_template("contact.html")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder="120EastState3",
            resource_type="auto"
        )
        
        # Return the image URL
        return jsonify({
            'success': True,
            'image_url': upload_result.get('secure_url')
        })
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)


@app.route('/Login')
def login():
    user_info = Auth.authenticate()
    # print(user_info)
    username = user_info['email']

    prev_author = flask.request.cookies.get('prev_author')
    if prev_author is None:
        prev_author = '(None)'

    html_code = flask.render_template('searchform.html',
        username=username,
        prev_author=prev_author)
    response = flask.make_response(html_code)
    return response


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

