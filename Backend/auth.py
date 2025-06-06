#!/usr/bin/env python

#-----------------------------------------------------------------------
# auth.py
# Author: Andrew Cho, Brian Seo, Henry Li
#   With lots of help from 
# https://jwt.io/introduction#:~:text=JSON%20Web%20Token%20(JWT)%20is,because%20it%20is%20digitally%20signed.
#-----------------------------------------------------------------------

import os
import json
import requests
import jwt
import oauthlib.oauth2
from flask import Blueprint, session, redirect, request, url_for, jsonify, g
from datetime import datetime, timedelta
from database import User, db
from functools import wraps
from dotenv import load_dotenv

#-----------------------------------------------------------------------

load_dotenv()

# Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

# OAuth configuration (development only) to let access nonhttps. without it, it will throw an error
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.environ['GOOGLE_CLIENT_ID']
GOOGLE_CLIENT_SECRET = os.environ['GOOGLE_CLIENT_SECRET']
client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

FRONTEND_ORIGIN = os.environ['FRONTEND_ORIGIN']

# JWT
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXP_DELTA_SECONDS = os.environ['JWT_EXP_DELTA_SECONDS']

#-----------------------------------------------------------------------

# Shared helpers
def jwt_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Initialize g.current_user to None by default
        g.current_user = None

        # Skip checks for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)

        # Check for Authorization header
        auth = request.headers.get("Authorization", None)
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error":"Missing token"}), 401

        token = auth.split()[1]
        try:
            # Decode and verify the token
            data = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM]
            )

            # Load user into request context
            g.current_user = User.query.filter_by(google_id=data["sub"]).first()
            if not g.current_user:
                return jsonify({"error":"Unknown user"}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({"error":"Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error":"Invalid token"}), 401
        except Exception as e:
            return jsonify({"error":f"Authentication error: {str(e)}"}), 401

        return f(*args, **kwargs)
    return wrapper

#-----------------------------------------------------------------------

def require_roles(*roles):
    """Decorator to check if the authenticated user has the required role"""
    def decorator(f):
        @wraps(f)
        @jwt_required  # First verify JWT is valid
        def wrapper(*args, **kwargs):
            # g.current_user is set by jwt_required
            if g.current_user.role not in roles:
                return jsonify({'error': 'Unauthorized'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

#-----------------------------------------------------------------------

# Helper function to get the current user from the token
def get_current_user():
    """
    Decode the Bearer token and return the User instance,
    or None if missing/invalid.
    """
    auth = request.headers.get("Authorization", None)
    if not auth or not auth.startswith("Bearer "):
        return None

    token = auth.split()[1]
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return User.query.filter_by(google_id=data["sub"]).first()
    except Exception:
        return None

#-----------------------------------------------------------------------

def get_or_create_user(userinfo):
    """Find or create a user from Google userinfo"""
    user = User.query.filter_by(google_id=userinfo['sub']).first()
    admin_emails = ['120eaststate@gmail.com']


    # Assign admin role if appropriate
    admin_domains = ['@princeton.edu', '@120eaststate.org']
    email = userinfo['email']
    is_admin = any(email.endswith(d) for d in admin_domains) or email in admin_emails

    if not user:
        # Create new user
        user = User(
            google_id=userinfo['sub'],
            email=userinfo['email'],
            name=userinfo['name'],
            profile_pic=userinfo.get('picture'),
            role='admin' if is_admin else 'user'
        )
        db.session.add(user)
        db.session.commit()
    elif is_admin and user.role != 'admin':
        # Update existing user to admin if needed
        user.role = 'admin'
        db.session.commit()

    return user

#-----------------------------------------------------------------------

@auth_bp.route('/api/auth/login', methods=['GET'])
def login():
    try:
        # Store the returnTo path from the frontend
        return_to = request.args.get('returnTo')
        if return_to:
            session['return_to'] = return_to

        # Get Google's OAuth configuration
        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=2).json()
        authorization_endpoint = google_provider_cfg['authorization_endpoint']

        # Build the redirect URI with proper callback URL
        request_uri = client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=url_for('auth.callback', _external=True),
            scope=['openid', 'email', 'profile'],
            state=return_to,
            prompt='select_account' # enforce user selection
        )

        # Since the frontend is now directly redirecting to this endpoint,
        # we should redirect the user directly to Google's auth endpoint
        return redirect(request_uri)
    except Exception as e:
        print(f"Login error: {str(e)}")
        # If there's an error, return JSON response that can be handled
        return jsonify({
            'error': f'Authentication error: {str(e)}',
            'redirect_url': None
        }), 500

#-----------------------------------------------------------------------

@auth_bp.route('/api/auth/login/callback', methods=['GET'])
def callback():
    try:
        # Get authorization code from Google's response
        code = request.args.get('code')

        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400

        # Get token endpoint from Google's discovery document
        google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        token_endpoint = google_provider_cfg['token_endpoint']

        # Prepare and send token request
        token_url, headers, body = client.prepare_token_request(
            token_endpoint,
            authorization_response=request.url,
            redirect_url=request.base_url,
            code=code
        )
        token_resp = requests.post(
            token_url, headers=headers, data=body,
            auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET), timeout=5
        )

        # Parse token response
        client.parse_request_body_response(json.dumps(token_resp.json()))

        # Get user info using the token
        userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
        uri, headers, body = client.add_token(userinfo_endpoint)
        userinfo_resp = requests.get(uri, headers=headers, data=body, timeout=5)
        userinfo = userinfo_resp.json()

        # Verify email and create JWT token
        if userinfo.get('email_verified'):
            # Find or create the user
            user = get_or_create_user(userinfo)

            # Create JWT token
            # Using utcnow for backward compatibility, but adding timezone info
            exp = datetime.utcnow() + timedelta(
                seconds=int(JWT_EXP_DELTA_SECONDS)  # One week default in .env
            )
            payload = {
                "sub": user.google_id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "profile_pic": user.profile_pic,
                "exp": exp.timestamp()
            }
            token = jwt.encode(
                payload,
                JWT_SECRET,
                algorithm=JWT_ALGORITHM
            )

            # Construct the full redirect URL with the token as a query parameter
            redirect_url = f"{FRONTEND_ORIGIN}?token={token}"

            print(f"Redirecting to: {redirect_url}")
            return redirect(redirect_url)
        else:
            return jsonify({'error': 'User email not verified by Google'}), 400

    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({'error': f'Authentication error: {str(e)}'}), 500

#-----------------------------------------------------------------------

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    # For JWT, logout is handled client-side by removing the token. simply returns a success message.
    # Nothing to do server-side
    return jsonify({'success': True, 'message': 'Logged out'})

#-----------------------------------------------------------------------

@auth_bp.route('/api/auth/user', methods=['GET'])
@jwt_required
def get_user():
    user = g.current_user
    return jsonify({'authenticated': True, 'user': {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'profile_pic': user.profile_pic,
        'role': user.role
    }})
