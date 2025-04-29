#Defines database schema and maps python classes to database tables using sqlalchemy
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

db = SQLAlchemy()  

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<Message {self.content}>'
    
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # Tag field (string) for posts
    tag = db.Column(db.String(100), nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Allow null for backward compatibility
    user = db.relationship('User', backref=db.backref('posts', lazy=True))
    status = db.Column(db.String(20), default='pending')
    def __repr__(self):
        return f'<Post {self.title}>'
    
# User Table    
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    profile_pic = db.Column(db.String(500), nullable=True)  # URL to Google profile picture
    role = db.Column(db.String(50), default='user')  # e.g., user, writer, admin
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.name}>'

class MediaType(str, Enum):
    IMAGE = 'image'
    VIDEO = 'video'
    AUDIO = 'audio'
    DOCUMENT = 'document'
    
# Media Table
class Media(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)  # 'image', 'video', 'audio', 'document'
    public_id = db.Column(db.String(200), nullable=True)  # Cloudinary public ID
    filename = db.Column(db.String(200), nullable=True)  # Original filename
    caption = db.Column(db.String(500), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    post = db.relationship('Post', backref=db.backref('media_files', lazy=True, cascade='all, delete-orphan'))
    
    def __repr__(self):
        return f'<Media {self.media_type}: {self.filename}>'

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

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# Tag Table
class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    display_order = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500), nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    date_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Tag {self.name}>'

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