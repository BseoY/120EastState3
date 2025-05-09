import pytest
from flask import url_for
from database import User

class TestAuthPaths:
    def test_successful_login_path(self, client, mocker):
        """Test complete OAuth flow path"""
        # Mock OAuth responses
        mocker.patch('requests.get').return_value.json.return_value = {
            'authorization_endpoint': 'https://accounts.google.com/o/oauth2/auth',
            'token_endpoint': 'https://oauth2.googleapis.com/token',
            'userinfo_endpoint': 'https://openidconnect.googleapis.com/v1/userinfo'
        }
        
        # Mock token response
        mock_post = mocker.patch('requests.post')
        mock_post.return_value.json.return_value = {
            'access_token': 'test-token'
        }
        
        # Mock userinfo
        mock_get = mocker.patch('requests.get')
        mock_get.return_value.json.return_value = {
            'sub': 'new-user-789',
            'email': 'new@example.com',
            'email_verified': True,
            'name': 'New User',
            'picture': 'http://example.com/pic.jpg'
        }
        
        # Start login
        response = client.get('/api/auth/login?returnTo=/dashboard')
        assert response.status_code == 302
        
        # Simulate callback
        response = client.get('/api/auth/login/callback?code=test-code')
        assert response.status_code == 302
        assert 'token=' in response.location

    def test_failed_login_paths(self, client, mocker):
        """Test various failed login scenarios"""
        # Path 1: Missing authorization code
        response = client.get('/api/auth/login/callback')
        assert response.status_code == 400
        
        # Path 2: Invalid token response
        mocker.patch('requests.post').side_effect = Exception('Token error')
        response = client.get('/api/auth/login/callback?code=bad-code')
        assert response.status_code == 500
        
        # Path 3: Unverified email
        mock_get = mocker.patch('requests.get')
        mock_get.return_value.json.return_value = {
            'email_verified': False
        }
        response = client.get('/api/auth/login/callback?code=test-code')
        assert response.status_code == 400

    def test_protected_paths(self, client, auth):
        """Test access control paths"""
        # Path 1: Unauthenticated access to protected route
        response = client.get('/api/user/posts')
        assert response.status_code == 401
        
        # Path 2: Regular user access
        auth.login()
        response = client.get('/api/user/posts')
        assert response.status_code == 200
        
        # Path 3: Admin-only route
        response = client.get('/api/admin/users')
        assert response.status_code == 403
        
        # Path 4: Admin access
        auth.admin_login()
        response = client.get('/api/admin/users')
        assert response.status_code == 200
