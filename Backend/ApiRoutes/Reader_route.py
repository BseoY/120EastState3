from flask import Blueprint, jsonify, request

reader_routes = Blueprint('reader_routes', __name__)

@reader_routes.route('/content', methods=['GET'])
def get_content():
    # Logic to retrieve content for readers
    return jsonify({"message": "Content for readers"})

@reader_routes.route('/comments', methods=['POST'])
def post_comment():
    content = request.get_json()
    # Logic to handle comment submission
    return jsonify({"message": "Comment posted"})