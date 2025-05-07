from flask import Flask
from database import db, Announcement, Post, Tag
import os
import dotenv
from datetime import datetime
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError, OperationalError

# Custom function to execute DDL safely
def execute_ddl_safely(conn, ddl_statement):
    """Safely execute a DDL statement and handle potential errors"""
    try:
        conn.execute(text(ddl_statement))
        conn.commit()
        return True
    except ProgrammingError as e:
        # Usually occurs when something already exists
        if "already exists" in str(e):
            print(f"Info: {str(e)}")
            return True
        print(f"SQL Error: {str(e)}")
        return False
    except OperationalError as e:
        # Usually occurs when something doesn't exist
        print(f"Operation Error: {str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return False

# Load environment variables
dotenv.load_dotenv()

# Initialize app
app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://test1:120ES3@127.0.0.1:5432/testdb')
# Replace 'postgres://' with 'postgresql://' for Heroku compatibility
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)

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



    # Check if media table exists and verify all required columns are present
    if 'media' in tables:
        media_columns = [column['name'] for column in inspector.get_columns('media')]
        
        # The Media model has the following columns that need to be checked:
        # 1. id (primary key, should already exist)
        # 2. post_id (foreign key, should already exist)
        # 3. url (should already exist)
        # 4. media_type (should already exist)
        # 5. public_id
        # 6. filename
        # 7. caption
        # 8. uploaded_at
        
        # Check for public_id column
        if 'public_id' not in media_columns:
            print("Adding public_id column to Media table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE media ADD COLUMN public_id VARCHAR(200)'))
                conn.commit()
            print("public_id column added successfully!")
        else:
            print("public_id column already exists in Media table.")
            
        # Check for filename column
        if 'filename' not in media_columns:
            print("Adding filename column to Media table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE media ADD COLUMN filename VARCHAR(200)'))
                conn.commit()
            print("filename column added successfully!")
        else:
            print("filename column already exists in Media table.")
        
        # Check for caption column
        if 'caption' not in media_columns:
            print("Adding caption column to Media table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE media ADD COLUMN caption VARCHAR(500)'))
                conn.commit()
            print("caption column added successfully!")
        else:
            print("caption column already exists in Media table.")
            
        # Check for uploaded_at column
        if 'uploaded_at' not in media_columns:
            print("Adding uploaded_at column to Media table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE media ADD COLUMN uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'))
                conn.commit()
            print("uploaded_at column added successfully!")
        else:
            print("uploaded_at column already exists in Media table.")

    # Focus specifically on the Announcement table
    print("\n=== ANNOUNCEMENT TABLE UPDATE ===\n")
    
    # Check if Announcement table exists
    if 'announcement' not in tables:
        print("Creating Announcement table...")
        success = execute_ddl_safely(db.engine.connect(), '''
            CREATE TABLE announcement (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES "user"(id),
                title VARCHAR(200) NOT NULL,
                content TEXT NOT NULL,
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                date_start TIMESTAMP NOT NULL,
                date_end TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        ''')
        
        if success:
            print("✅ Announcement table created successfully!")
        else:
            print("❌ Failed to create Announcement table. Check database connection.")
    else:
        print("Announcement table already exists. Checking structure...")
        
        # Refresh columns data to ensure we have the most up-to-date information
        inspector = inspect(db.engine)
        announcement_columns = [column for column in inspector.get_columns('announcement')]
        announcement_col_names = [column['name'] for column in announcement_columns]
        
        # Add missing columns if needed
        if 'is_active' not in announcement_col_names:
            print("Adding is_active column to Announcement table...")
            success = execute_ddl_safely(db.engine.connect(), 
                'ALTER TABLE announcement ADD COLUMN is_active BOOLEAN DEFAULT TRUE')
            if success:
                print("✅ is_active column added successfully!")
            else:
                print("❌ Failed to add is_active column.")
        else:
            print("✓ is_active column already exists.")
        
        # Make date_end nullable if it exists and is not nullable
        date_end_column = None
        for column in announcement_columns:
            if column['name'] == 'date_end':
                date_end_column = column
                break
        
        if date_end_column:
            if not date_end_column.get('nullable', False):
                print("Updating date_end column to be nullable...")
                success = execute_ddl_safely(db.engine.connect(),
                    'ALTER TABLE announcement ALTER COLUMN date_end DROP NOT NULL')
                if success:
                    print("✅ date_end column updated to be nullable!")
                else:
                    print("❌ Failed to make date_end nullable. It might already be nullable.")
            else:
                print("✓ date_end is already nullable.")
        else:
            # date_end column doesn't exist, add it
            print("Adding date_end column to Announcement table...")
            success = execute_ddl_safely(db.engine.connect(),
                'ALTER TABLE announcement ADD COLUMN date_end TIMESTAMP')
            if success:
                print("✅ date_end column added successfully!")
            else:
                print("❌ Failed to add date_end column.")
                
        # Check for date_start column explicitly - this is what your error message is about
        if 'date_start' not in announcement_col_names:
            print("CRITICAL: Adding missing date_start column to Announcement table...")
            success = execute_ddl_safely(db.engine.connect(),
                'ALTER TABLE announcement ADD COLUMN date_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP')
            if success:
                print("✅ date_start column added successfully!")
            else:
                print("❌ Failed to add date_start column.")
    
    # Check if Tag table exists
    if 'tag' not in tables:
        print("Creating Tag table...")
        with db.engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE tag (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) NOT NULL UNIQUE,
                    description TEXT,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    color VARCHAR(20) DEFAULT '#3498db'
                )
            '''))
            conn.commit()
        print("Tag table created successfully!")
    else:
        print("Tag table already exists.")
        
        # Check for Tag table structure
        tag_columns = [column['name'] for column in inspector.get_columns('tag')]
        
        if 'color' not in tag_columns:
            print("Adding color column to Tag table...")
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE tag ADD COLUMN color VARCHAR(20) DEFAULT \'#3498db\''))
                conn.commit()
            print("color column added successfully!")
        else:
            print("color column already exists in Tag table.")
    
    # Check if post_tag table exists (many-to-many relationship between Post and Tag)
    if 'post_tag' not in tables:
        print("Creating post_tag junction table...")
        with db.engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE post_tag (
                    post_id INTEGER REFERENCES post(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tag(id) ON DELETE CASCADE,
                    PRIMARY KEY (post_id, tag_id)
                )
            '''))
            conn.commit()
        print("post_tag table created successfully!")
    else:
        print("post_tag table already exists.")
        
    # Check for additional User columns that may have been added
    user_columns = [column['name'] for column in inspector.get_columns('user')]
    
    # Make sure User has role column
    if 'role' not in user_columns:
        print("Adding role column to User table...")
        with db.engine.connect() as conn:
            conn.execute(text('ALTER TABLE "user" ADD COLUMN role VARCHAR(50) DEFAULT \'user\''))
            conn.commit()
        print("role column added successfully!")
    else:
        print("role column already exists in User table.")
        

    # Add tag_id column to Post table if it doesn't exist
    if 'tag_id' not in columns:
        print("\n=== ADDING TAG_ID TO POST TABLE ===\n")
        print("Adding tag_id column to Post table...")
        success = execute_ddl_safely(db.engine.connect(),
            'ALTER TABLE post ADD COLUMN tag_id INTEGER REFERENCES tag(id)')
        if success:
            print("✅ tag_id column added successfully!")
            
            # Migrate existing tag strings to tag_id references
            print("\n=== MIGRATING EXISTING TAGS ===\n")
            print("Migrating from tag strings to tag_id references...")
            # Get all posts with tag values
            posts_with_tags = db.session.query(Post).filter(Post.tag != None).all()
            print(f"Found {len(posts_with_tags)} posts with tags to migrate")
            
            # Process each post
            for post in posts_with_tags:
                if post.tag:
                    # Find or create the tag
                    tag = db.session.query(Tag).filter_by(name=post.tag).first()
                    if not tag:
                        # Create the tag if it doesn't exist
                        tag = Tag(name=post.tag)
                        db.session.add(tag)
                        db.session.flush()  # To get the ID
                        print(f"Created new tag: {tag.name} (ID: {tag.id})")
                    
                    # Update the post's tag_id
                    post.tag_id = tag.id
                    print(f"Updated post ID {post.id} to use tag_id {tag.id} ('{tag.name}')")
            
            # Commit all changes
            db.session.commit()
            print("Migration completed successfully!")
        else:
            print("❌ Failed to add tag_id column to Post table.")
    else:
        print("tag_id column already exists in Post table.")

    # Don't create test data automatically - this can be done manually if needed
    # More important to get the schema right first

    print("\n=== DATABASE UPDATE SUMMARY ===\n")
    print("✅ Schema update attempts completed.")
    print("✅ Announcement table structure should now match the model definition.")
    print("✅ Post-Tag relationship structure updated.")
    
    print("\nNext steps:")
    print("1. Restart your Flask application")
    print("2. Try accessing the announcements endpoints again")
    print("3. If still getting errors, check the Flask logs for specific error messages")
    print("\nIf you want to manually verify the database structure, run:")
    print("\tpsql <your-connection-string>")
    print(r"\t\SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'announcement';")
    # Using a raw string (r prefix) prevents Python from interpreting backslashes as escape characters
