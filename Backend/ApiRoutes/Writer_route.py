from flask import Blueprint, jsonify, request

writer_routes = Blueprint('writer_routes', __name__)

@writer_routes.route('/submissions', methods=['POST'])
def submit_content():
    content = request.get_json()
    # Logic to handle new content submission
    return jsonify({"message": "Content submitted successfully"})

@writer_routes.route('/drafts', methods=['GET'])
def get_drafts():
    # Logic to retrieve drafts of the writer
    return jsonify({"message": "List of drafts"})