# conftest.py
import os
import importlib.metadata
import werkzeug
import pytest
os.environ['JWT_SECRET']    = '769191eb22c96292530a0de6ca8aa33741e1314e20c8fae060a57379677bf657'
os.environ['JWT_ALGORITHM'] = 'HS256'

from App import app as flask_app
from database import db, User, Post, Tag
from datetime import datetime, timezone
from sqlalchemy import MetaData
import jwt as pyjwt
from auth import JWT_SECRET, JWT_ALGORITHM

# restore werkzeug.__version__ if needed
try:
    werkzeug.__version__ = importlib.metadata.version("werkzeug")
except importlib.metadata.PackageNotFoundError:
    werkzeug.__version__ = "0.0.0"

@pytest.fixture(scope="function")
def app():
    # 1) test config
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "postgresql://testuser:testpass@localhost/test_db",
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "WTF_CSRF_ENABLED": False,
        # JWT config so auth fixture can pull these
        "JWT_SECRET_KEY": os.getenv("JWT_SECRET"),
        "JWT_ALGORITHM": os.getenv("JWT_ALGORITHM"),
    })

    # 2) push an application context for the lifetime of this fixture
    ctx = flask_app.app_context()
    ctx.push()

    # 3) drop & recreate all tables
    db.session.remove()
    meta = MetaData()
    meta.reflect(bind=db.engine)
    meta.drop_all(bind=db.engine)
    db.create_all()

    # 4) seed two users, but only store primitives on app
    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    admin = User(
        google_id=f"admin-123-{suffix}",
        email=f"admin+{suffix}@120eaststate.org",
        name="Admin User",
        role="admin"
    )
    regular = User(
        google_id=f"user-456-{suffix}",
        email=f"user+{suffix}@example.com",
        name="Regular User"
    )
    db.session.add_all([admin, regular])
    db.session.commit()

    # only primitives! no ORM instances
    flask_app.test_admin_google_id   = admin.google_id
    flask_app.test_admin_email       = admin.email
    flask_app.test_regular_google_id = regular.google_id
    flask_app.test_regular_email     = regular.email
    flask_app.test_regular_user_id   = regular.id

    yield flask_app

    # 5) teardown: drop tables and pop context
    db.session.remove()
    meta = MetaData()
    meta.reflect(bind=db.engine)
    meta.drop_all(bind=db.engine)
    ctx.pop()

@pytest.fixture
def client(app):
    with app.test_client() as client:
        yield client

import jwt as pyjwt
from flask_jwt_extended import decode_token


@pytest.fixture
def auth(client, app):
    import jwt as pyjwt
    from auth import JWT_SECRET, JWT_ALGORITHM

    class AuthActions:
        def __init__(self):
            self.token = None

        # accept both `user="admin"` *and* `user_id="some-google-id"`:
        def login(self, user=None, user_id=None):
            if user_id is not None:
                sub = user_id
            elif user == "admin":
                sub = app.test_admin_google_id
            else:
                sub = app.test_regular_google_id

            # Build a minimal JWT with only the sub claim
            payload = {"sub": sub}
            self.token = pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

            # Inject the header for every subsequent request
            client.environ_base["HTTP_AUTHORIZATION"] = f"Bearer {self.token}"

        def admin_login(self):
            return self.login(user="admin")

        def logout(self):
            client.environ_base.pop("HTTP_AUTHORIZATION", None)
            self.token = None

        def get_headers(self):
            return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    return AuthActions()


@pytest.fixture
def test_post(app, auth):
    # Now that context is active, we can freely use ORM here
    tag = Tag(name="test-tag")
    post = Post(
        title="Test Post",
        content="Test content",
        user_id=app.test_regular_user_id,
        tag=tag,
        status="pending"
    )
    db.session.add_all([tag, post])
    db.session.commit()
    # return only the ID
    return post.id