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

# User Table
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # e.g., writer or admin
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.name}>'

# Posts Table
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tag = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), nullable=False)  # e.g., pending, approved, rejected
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    date_updated = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('posts', lazy=True))

    def __repr__(self):
        return f'<Post {self.title}>'

# Media Table
class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    url = db.Column(db.String(200), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)  # e.g., image, video
    caption = db.Column(db.String(500), nullable=True)

    post = db.relationship('Post', backref=db.backref('media', lazy=True))

    def __repr__(self):
        return f'<Media {self.url}>'

# Announcements Table
class Announcement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('announcements', lazy=True))

    def __repr__(self):
        return f'<Announcement {self.title}>'

# Administration Actions Table
class AdminAction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # e.g., approved, rejected, deleted
    date_of_action = db.Column(db.DateTime, default=datetime.utcnow)
    feedback = db.Column(db.String(500), nullable=True)

    user = db.relationship('User', backref=db.backref('admin_actions', lazy=True))
    post = db.relationship('Post', backref=db.backref('admin_actions', lazy=True))

    def __repr__(self):
        return f'<AdminAction {self.action}>'
    
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