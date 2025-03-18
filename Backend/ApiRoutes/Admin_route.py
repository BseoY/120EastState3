from flask import Blueprint, jsonify, request

admin_routes = Blueprint('admin_routes', __name__)

@admin_routes.route('/users', methods=['GET'])
def get_users():
    # Logic to retrieve users
    return jsonify({"message": "List of users"})

@admin_routes.route('/submissions', methods=['GET'])
def get_submissions():
    # Logic to retrieve user submissions
    return jsonify({"message": "List of submissions"})