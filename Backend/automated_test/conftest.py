# conftest.py
import pytest
import jwt
from App import app as flask_app
from auth import JWT_SECRET, JWT_ALGORITHM

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
    return app.test_client()

@pytest.fixture(scope="function")
def admin_token():
    # payload keys should match what require_roles() expects
    payload = {
        "email": "120eaststate@gmail.com",
        "roles": ["admin"]
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)