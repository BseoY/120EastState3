#!/usr/bin/env python

#-----------------------------------------------------------------------
# auth.py
# Author: Bob Dondero
#   With lots of help from https://realpython.com/flask-google-login/
#-----------------------------------------------------------------------
import os
import json
import requests
import flask
import oauthlib.oauth2
import dotenv

from top import app

#-----------------------------------------------------------------------

GOOGLE_DISCOVERY_URL = (
    'https://accounts.google.com/.well-known/openid-configuration')

dotenv.load_dotenv()
GOOGLE_CLIENT_ID = os.environ['GOOGLE_CLIENT_ID']
GOOGLE_CLIENT_SECRET = os.environ['GOOGLE_CLIENT_SECRET']

client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

#-----------------------------------------------------------------------

@app.route('/login', methods=['GET'])
def login():

    # Determine the URL for Google login.
    google_provider_cfg = requests.get(
        GOOGLE_DISCOVERY_URL, timeout=2).json()
    authorization_endpoint = (
        google_provider_cfg['authorization_endpoint'])

    # Store the referrer path in session to redirect back after login
    referrer = flask.request.referrer or ''
    if 'localhost:3000' in referrer:
        path = referrer.split('localhost:3000')[-1]
        if path:
            flask.session['redirect_after_login'] = path
        else:
            flask.session['redirect_after_login'] = '/archive'
    else:
        flask.session['redirect_after_login'] = '/archive'
        
    # Construct the request URL for Google login, providing scopes
    # to fetch the user's profile data.
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri = flask.request.base_url + '/callback',
        scope=['openid', 'email', 'profile'],
    )

    #-------------------------------------------------------------------
    # For learning:
    # print('request_uri:', request_uri, file=sys.stderr)
    #-------------------------------------------------------------------

    # Redirect to the request URL.
    return flask.redirect(request_uri)

#-----------------------------------------------------------------------

@app.route('/login/callback', methods=['GET'])
def callback():

    # Get the authorization code that Google sent.
    code = flask.request.args.get('code')

    #-------------------------------------------------------------------
    # For learning:
    # print('code:', code, file=sys.stderr)
    #-------------------------------------------------------------------

    # Determine the URL to fetch tokens that allow the application to
    # ask for the user's profile data.
    google_provider_cfg = requests.get(
        GOOGLE_DISCOVERY_URL, timeout=2).json()
    token_endpoint = google_provider_cfg['token_endpoint']

    # Construct a request to fetch the tokens.
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=flask.request.url,
        redirect_url=flask.request.base_url,
        code=code
    )

    #-------------------------------------------------------------------
    # For learning:
    # print('token_url:', token_url, file=sys.stderr)
    # print('headers:', headers, file=sys.stderr)
    # print('body:', body, file=sys.stderr)
    #-------------------------------------------------------------------

    # Fetch the tokens.
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
        timeout=2
    )

    #-------------------------------------------------------------------
    # For learning:
    # print('token_response.json():', token_response.json(),
    #     file=sys.stderr)
    #-------------------------------------------------------------------

    # Parse the tokens.
    client.parse_request_body_response(
        json.dumps(token_response.json()))

    # Using the tokens, fetch the user's profile data,
    # including the user's Google profile image and email address.
    userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
    uri, headers, body = client.add_token(userinfo_endpoint)

    #-------------------------------------------------------------------
    # For learning:
    # print('uri:', uri, file=sys.stderr)
    # print('headers:', headers, file=sys.stderr)
    # print('body:', body, file=sys.stderr)
    #-------------------------------------------------------------------

    userinfo_response = requests.get(uri, headers=headers, data=body,
        timeout=2)

    #-------------------------------------------------------------------
    # For learning:
    # print('userinfo_response.json():', userinfo_response.json(),
    #     file=sys.stderr)
    #-------------------------------------------------------------------

    # Optional: Make sure the user's email address is verified.
    if not userinfo_response.json().get('email_verified'):
        message = 'User email not available or not verified by Google.'
        return message, 400

    # Save the user profile data in the session.
    flask.session['user_info'] = userinfo_response.json()

    # Get the intended destination from session or default to archive
    redirect_path = flask.session.get('redirect_after_login', '/archive')
    
    # Redirect to the frontend with login success parameter
    return flask.redirect(f'http://localhost:3000{redirect_path}?login_success=true')

#-----------------------------------------------------------------------

@app.route('/logoutapp', methods=['GET'])
def logoutapp():

    # Log out of the application.
    flask.session.clear()
    html_code = flask.render_template('loggedout.html')
    response = flask.make_response(html_code)
    return response

#-----------------------------------------------------------------------

@app.route('/logoutgoogle', methods=['GET'])
def logoutgoogle():

    # Log out of the application.
    flask.session.clear()

    # Log out of Google.
    flask.abort(flask.redirect(
        'https://mail.google.com/mail/u/0/?logout&hl=en'))

#-----------------------------------------------------------------------

def authenticate():

    if 'user_info' not in flask.session:
        flask.abort(flask.redirect(flask.url_for('login')))

    return flask.session.get('user_info')
