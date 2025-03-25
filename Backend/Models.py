#Defines databse schema and maps python classes to database tables using sqlalchemy
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<Message {self.content}>'
"""
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
"""