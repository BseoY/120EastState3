# ================= パート1：依存モジュールと環境変数 =================
import os
import dotenv
dotenv.load_dotenv()  # << Load .env BEFORE anything else

from flask import Flask, jsonify, request, session, redirect, url_for
from flask_cors import CORS
from Models import db, Post, User
from datetime import timedelta
import cloudinary
import cloudinary.uploader
from cloudinary_config import configure_cloudinary
import json
import requests
import oauthlib.oauth2

# ================= パート2：Flask AppとCORSの初期化 =================
app = Flask(__name__)
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
CORS(app, supports_credentials=True, origins=[FRONTEND_ORIGIN, "http://localhost:3000"])
print("✅ CORS allowed:", FRONTEND_ORIGIN)

# ================= パート3：セッション・DB・クラウド設定 =================
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
configure_cloudinary()

with app.app_context():
    db.create_all()

# ================= パート4：OAuth設定 =================
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
GOOGLE_DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration'
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
oauth_client = oauthlib.oauth2.WebApplicationClient(GOOGLE_CLIENT_ID)

# ================= パート5：認証ユーティリティ =================
def get_current_user():
    if 'user_info' not in session:
        return None
    user_info = session['user_info']
    user = User.query.filter_by(google_id=user_info['sub']).first()
    if not user:
        user = User(
            google_id=user_info['sub'],
            email=user_info['email'],
            name=user_info['name'],
            profile_pic=user_info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    return user

# ================= パート6：認証ルート =================
@app.route('/api/auth/login', methods=['GET'])
def login():
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    authorization_endpoint = google_provider_cfg['authorization_endpoint']
    redirect_uri = url_for('callback', _external=True)
    request_uri = oauth_client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=redirect_uri,
        scope=['openid', 'email', 'profile'],
    )
    return jsonify({'redirect_url': request_uri})

@app.route('/api/auth/login/callback', methods=['GET'])
def callback():
    code = request.args.get('code')
    google_provider_cfg = requests.get(GOOGLE_DISCOVERY_URL).json()
    token_endpoint = google_provider_cfg['token_endpoint']
    token_url, headers, body = oauth_client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )
    oauth_client.parse_request_body_response(json.dumps(token_response.json()))
    userinfo_endpoint = google_provider_cfg['userinfo_endpoint']
    uri, headers, body = oauth_client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)
    if userinfo_response.json().get('email_verified'):
        session['user_info'] = userinfo_response.json()
        get_current_user()
        return redirect(os.getenv("FRONTEND_REDIRECT_URL", "http://localhost:3000"))
    else:
        return jsonify({'error': 'User email not verified'}), 400

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/auth/user', methods=['GET'])
def get_user():
    user = get_current_user()
    if user:
        return jsonify({
            'authenticated': True,
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'profile_pic': user.profile_pic,
                'role': user.role
            }
        })
    else:
        return jsonify({'authenticated': False})

# ================= パート7：投稿とアップロード =================
@app.route('/api/posts', methods=['GET', 'POST'])
def handle_posts():
    if request.method == 'POST':
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        data = request.get_json()
        if not data or 'title' not in data or 'content' not in data:
            return jsonify({'error': 'Title and content required'}), 400

        image_url = data.get('image_url')
        video_url = data.get('video_url')

        if 'image' in data and not image_url:
            upload_result = cloudinary.uploader.upload(data['image'], folder="120EastState3")
            image_url = upload_result.get('secure_url')

        if 'video' in data and not video_url:
            upload_result = cloudinary.uploader.upload(data['video'], folder="120EastState3/videos", resource_type="video")
            video_url = upload_result.get('secure_url')

        post = Post(
            title=data['title'],
            content=data['content'],
            tag=data.get('tag'),
            image_url=image_url,
            video_url=video_url,
            user_id=user.id
        )
        db.session.add(post)
        db.session.commit()
        return jsonify({'message': 'Post created', 'post_id': post.id})

    posts = Post.query.all()
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'content': p.content,
        'tag': p.tag,
        'image_url': p.image_url,
        'video_url': p.video_url,
        'author': p.user.name if p.user else 'Anonymous',
        'profile_pic': p.user.profile_pic if p.user else None
    } for p in posts])

@app.route('/api/upload', methods=['POST'])
def upload_file():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    is_video = file.filename.lower().endswith(('.mp4', '.mov', '.avi', '.webm'))
    folder = "120EastState3/videos" if is_video else "120EastState3"
    resource_type = "video" if is_video else "auto"

    upload_result = cloudinary.uploader.upload(file, folder=folder, resource_type=resource_type)

    return jsonify({'url': upload_result.get('secure_url')})

# ================= パート8：アプリ起動 =================
if __name__ == '__main__':
    app.run(debug=True, port=5001)


# This route was removed to avoid conflicts with the Google auth login route


"""       
@app.route('/')
def index():
    return render_template("index.html")

@app.route('/about')
def about():
    return render_template("about.html")

@app.route('/ContactUs')
def contact():
    return render_template("contact.html")
"""
# API endpoint to get all archive items
"""
@app.route('/api/items', methods=['GET'])
def get_items():
    items = ArchiveItem.query.all()
    return jsonify([
        {'id': item.id, 'title': item.title, 'description': item.description}
        for item in items
    ])
"""