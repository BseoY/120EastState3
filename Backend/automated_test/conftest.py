import pytest
import jwt
from werkzeug.security import generate_password_hash
from App import app as flask_app
from database import db, User
from auth import JWT_SECRET, JWT_ALGORITHM
from datetime import datetime, timedelta
@pytest.fixture(scope="function")
def app():
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "postgresql://testuser:testpass@localhost/test_db",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "WTF_CSRF_ENABLED": False,
    })
    with flask_app.app_context():
        yield flask_app

@pytest.fixture(scope="function")
def client(app):
    with app.app_context():
        db.create_all()
        
        # Create test user according to your actual User model
        test_user = User(
            google_id="test_google_id_123",
            email="test@example.com",
            name="Test User",
            profile_pic="https://example.com/profile.jpg",
            role="admin"  # or "user" depending on test needs
        )
        db.session.add(test_user)
        db.session.commit()
        
        yield app.test_client()
        
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope="function")
def admin_token():
    payload = {
        "sub": "test-admin@example.com",
        "email": "test-admin@example.com",
        "google_id": "test_admin_google_id",
        "name": "Admin User",
        "profile_pic": "https://example.com/admin.jpg",
        "role": "admin",
        # Add these standard JWT claims if your auth system expects them:
        "iss": "your-issuer",  # Same as in your auth config
        "aud": "your-audience",
        "iat": datetime.utcnow(),  # Issued at
        "exp": datetime.utcnow() + timedelta(minutes=30)  # Expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@pytest.fixture(scope="function")
def regular_token(client):
    # Create and return token for regular user
    login_resp = client.post("/api/login", json={
        "email": "test@example.com",
        "password": "testpass"
    })
    return login_resp.json["access_token"]