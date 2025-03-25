# Starts the server, registers the routes, and initializes the flask app
# Main react component that renders everything by combining all components
# (Main flask file? not sure what to do here)

from flask import Flask, jsonify, render_template, request
import flask
from flask_sqlalchemy import SQLAlchemy
import os
from flask_cors import CORS
from Models import Message
from Models import db
"""
import Auth
"""
import dotenv
#-----------------------------------------------------------------------

app = Flask(__name__)
CORS(app)

import datetime

#-----------------------------------------------------------------------

# Configure your PostgreSQL database connection.
# Change username, password, and dbname as needed.
# Secret Key is "36a3b936b986082dcfcbb314151043b741224c612ddc21917a9e4eb0fb030423"

dotenv.load_dotenv()
"""
app.secret_key = os.environ['APP_SECRET_KEY']
"""
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://test1:120ES3@127.0.0.1:5432/testdb')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

@app.route('/api/message', methods=['GET', 'POST'])
def handle_messages():
    if request.method == 'POST':
        # Get JSON data from React
        data = request.get_json()
        print("Parsed JSON:", data)
        
        # Create a new message in the database
        new_message = Message(content=data['message'])
        db.session.add(new_message)
        db.session.commit()
        
        # Return success response
        return jsonify({"message": "Message saved successfully!"}), 201
    
    elif request.method == 'GET':
        # Fetch all messages from the database
        messages = Message.query.all()
        
        # Convert messages to JSON and return
        return jsonify([{"id": msg.id, "content": msg.content} for msg in messages])

@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")


@app.route('/ContactUs')
def contact():
    return render_template("contact.html")

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
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Create tables if they don't exist
    app.run(debug=True)