# Starts the server, registers the routes, and initializes the flask app
# Main react component that renders everything by combining all components
# (Main flask file? not sure what to do here)

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
import os

#-----------------------------------------------------------------------

app = Flask(__name__)

#-----------------------------------------------------------------------

# Configure your PostgreSQL database connection.
# Change username, password, and dbname as needed.
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'postgresql://postgres:password@localhost/archive'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# A basic model for our archive items
class ArchiveItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.String(200))

@app.route('/')
def index():
    return "Hello, this is the Flask backend."

# API endpoint to get all archive items
@app.route('/api/items', methods=['GET'])
def get_items():
    items = ArchiveItem.query.all()
    return jsonify([
        {'id': item.id, 'title': item.title, 'description': item.description}
        for item in items
    ])

if __name__ == '__main__':
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
    app.run(debug=True)