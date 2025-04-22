import os
import json
import requests
from oauthlib.oauth2 import WebApplicationClient
from flask import Blueprint, session, redirect, request, url_for, jsonify
from database import User, db
from functools import wraps

# Blueprint for auth routes
auth_bp = Blueprint('auth', __name__)

# OAuth configuration (development only)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
oauth_client = WebApplicationClient(GOOGLE_CLIENT_ID)

# Helper to determine frontend origin
def get_frontend_origin():
    env = os.getenv('ENV')
    if env == 'production':
        return 'https://one20es-frontend-ea37035e8ebf.herokuapp.com'
    return 'http://localhost:3000'

@auth_bp.route('/api/auth/login', methods=['GET'])
def login():
    try:
        # Store the returnTo path from the frontend
        return_to = request.args.get('returnTo')
        if return_to:
            session['return_to'] = return_to

        # Get Google's OAuth configuration
        google_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        authorization_endpoint = google_cfg['authorization_endpoint']

        # Build the redirect URI with proper callback URL
        request_uri = oauth_client.prepare_request_uri(
            authorization_endpoint,
            redirect_uri=url_for('auth.callback', _external=True),
            scope=['openid', 'email', 'profile'],
            state=return_to
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

@auth_bp.route('/api/auth/login/callback', methods=['GET'])
def callback():
    try:
        # Get authorization code from Google's response
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400

        # Get token endpoint from Google's discovery document
        google_cfg = requests.get(GOOGLE_DISCOVERY_URL, timeout=5).json()
        token_endpoint = google_cfg['token_endpoint']
        
        # Prepare and send token request
        token_url, headers, body = oauth_client.prepare_token_request(
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
        oauth_client.parse_request_body_response(json.dumps(token_resp.json()))

        # Get user info using the token
        userinfo_endpoint = google_cfg['userinfo_endpoint']
        uri, headers, body = oauth_client.add_token(userinfo_endpoint)
        userinfo_resp = requests.get(uri, headers=headers, data=body, timeout=5)
        userinfo = userinfo_resp.json()

        # Verify email and create session
        if userinfo.get('email_verified'):
            # Store user info in session
            session['user_info'] = userinfo
            
            # Determine redirect target (from state parameter or session)
            return_to = request.args.get('state') or session.pop('return_to', None)
            frontend = get_frontend_origin()
            target = frontend
            
            if return_to:
                # Ensure return_to has a leading slash
                if not return_to.startswith('/'):
                    return_to = '/' + return_to
                target = f"{frontend}{return_to}"
                
            # Redirect to frontend with successful login
            return redirect(target)
        else:
            return jsonify({'error': 'User email not verified by Google'}), 400
            
    except Exception as e:
        print(f"Callback error: {str(e)}")
        return jsonify({'error': f'Authentication error: {str(e)}'}), 500

@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user_info', None)
    return jsonify({'success': True, 'message': 'Logged out'})

@auth_bp.route('/api/auth/user', methods=['GET'])
def get_user():
    user = get_current_user()
    if user:
        return jsonify({'authenticated': True, 'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'profile_pic': user.profile_pic,
            'role': user.role
        }})
    return jsonify({'authenticated': False})

# Shared helpers
def get_current_user():
    if 'user_info' not in session:
        return None
    info = session['user_info']
    user = User.query.filter_by(google_id=info['sub']).first()
    # Assign admin role
    admin_domains = ['@princeton.edu', '@120eaststate.org']
    if user and any(user.email.endswith(d) for d in admin_domains):
        user.role = 'admin'
    if not user:
        user = User(
            google_id=info['sub'],
            email=info['email'],
            name=info['name'],
            profile_pic=info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    return user

def require_roles(*roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'Authentication required'}), 401
            if user.role not in roles:
                return jsonify({'error': 'Unauthorized'}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator
