from flask import Flask
from Models import db, Post
import os
import dotenv
from sqlalchemy import Column, String, text

# Load environment variables
dotenv.load_dotenv()

# Initialize app
app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://test1:120ES3@127.0.0.1:5432/testdb')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Add the image_url column to the Post table
with app.app_context():
    # Check if the column already exists
    inspector = db.inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns('post')]
    
    if 'image_url' not in columns:
        print("Adding image_url column to Post table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE post ADD COLUMN image_url VARCHAR(500)'))
            conn.commit()
        print("Column added successfully!")
    else:
        print("image_url column already exists in Post table.")

print("Schema update complete!")
