# Starts the server, registers the routes, and initializes the flask app
# Main react component that renders everything by combining all components
# (Main flask file? not sure what to do here)

from flask import Flask, jsonify, render_template
import flask
from flask_sqlalchemy import SQLAlchemy
import os
import Auth
import dotenv
#-----------------------------------------------------------------------

app = Flask(__name__)

#-----------------------------------------------------------------------

# Configure your PostgreSQL database connection.
# Change username, password, and dbname as needed.

dotenv.load_dotenv()

app.secret_key = os.environ['APP_SECRET_KEY']
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