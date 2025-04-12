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

# Add columns to the Post table and create User table if needed
with app.app_context():
    # Check if the columns already exist in Post table
    inspector = db.inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns('post')]

    
    if 'image_url' not in columns:
        print("Adding image_url column to Post table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE post ADD COLUMN image_url VARCHAR(500)'))
            conn.commit()
        print("image_url column added successfully!")
    else:
        print("image_url column already exists in Post table.")
        
    if 'video_url' not in columns:
        print("Adding video_url column to Post table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE post ADD COLUMN video_url VARCHAR(500)'))
            conn.commit()
        print("video_url column added successfully!")
    else:
        print("video_url column already exists in Post table.")
        
    if 'user_id' not in columns:
        print("Adding user_id column to Post table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE post ADD COLUMN user_id INTEGER'))
            conn.commit()
        print("user_id column added successfully!")
    else:
        print("user_id column already exists in Post table.")
    
    if 'status' not in columns:
        print("Adding status column to Post table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE post ADD COLUMN status VARCHAR(20) DEFAULT \'pending\''))
            conn.commit()
        print("status column added successfully!")
    else:
        print("status column already exists in Post table.")

        
    # Check if User table exists
    tables = inspector.get_table_names()
    if 'user' not in tables:
        print("Creating User table...")
        with db.engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE "user" (
                    id SERIAL PRIMARY KEY,
                    google_id VARCHAR(120) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    name VARCHAR(120) NOT NULL,
                    profile_pic VARCHAR(500),
                    role VARCHAR(50) DEFAULT 'user',
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            '''))
            conn.commit()
        print("User table created successfully!")
    else:
        print("User table already exists.")
        
        # Check if profile_pic column exists in User table
        user_columns = [column['name'] for column in inspector.get_columns('user')]
        if 'profile_pic' not in user_columns:
            print("Adding profile_pic column to User table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE "user" ADD COLUMN profile_pic VARCHAR(500)'))
                conn.commit()
            print("profile_pic column added successfully!")
        else:
            print("profile_pic column already exists in User table.")

    if 'contact_message' not in tables:
        print("Creating ContactMessage table...")
        with db.engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE contact_message (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(120),
                    email VARCHAR(120),
                    message TEXT,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_read BOOLEAN DEFAULT FALSE
                )
            '''))
            conn.commit()
        print("ContactMessage table created successfully!")
    else:
        print("ContactMessage table already exists.")

    contact_columns = [column['name'] for column in inspector.get_columns('contact_message')]
    # Make sure contact_message has date_created
    if 'date_created' not in contact_columns:
        print("Adding date_created column to ContactMessage table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE contact_message ADD COLUMN date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
            conn.commit()
        print("date_created column added successfully!")
    else:
        print("date_created column already exists in ContactMessage table.")



print("Schema update complete!")
