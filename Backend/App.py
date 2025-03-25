from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from Models import db, Message
import os
import dotenv
from datetime import datetime

# Initialize app
app = Flask(__name__)
CORS(app)

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
@app.route('/api/message', methods=['GET', 'POST','OPTIONS'])
def handle_message():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 hours
        return response
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Content is required'}), 400
            
        try:
            new_message = Message(content=data['content'])
            db.session.add(new_message)
            db.session.commit()
            return jsonify({'message': 'Message added successfully!'}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'GET':
        messages = Message.query.all()
        return jsonify([{'id': msg.id, 'content': msg.content} for msg in messages])

# Frontend Routes
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/ContactUs')
def contact():
    return render_template("contact.html")

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

