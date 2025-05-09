import pytest
from database import User, Post, Announcement

class TestAdminPaths:
    def test_user_management_paths(self, client, auth):
        """Test admin user management paths"""
        auth.admin_login()
        
        # Path 1: List all users
        response = client.get('/api/admin/users')
        assert response.status_code == 200
        assert len(response.json) >= 2  # At least admin and regular user
        
        # Path 2: Promote user to admin
        user_id = next(u['id'] for u in response.json if u['role'] != 'admin')
        response = client.patch(f'/api/admin/users/{user_id}', json={
            'role': 'admin'
        })
        assert response.status_code == 200
        assert response.json['role'] == 'admin'
        
        # Path 3: Non-admin tries to access
        auth.login()
        response = client.get('/api/admin/users')
        assert response.status_code == 403

    def test_announcement_paths(self, client, auth):
        """Test announcement management paths"""
        auth.admin_login()
        
        # Path 1: Create announcement
        response = client.post('/api/announcements', json={
            'title': 'Test Announcement',
            'content': 'Test content',
            'date_end': '2023-12-31T00:00:00Z'
        })
        assert response.status_code == 201
        announcement_id = response.json['announcement']['id']
        
        # Path 2: Update announcement
        response = client.put(f'/api/announcements/{announcement_id}', json={
            'title': 'Updated Title',
            'is_active': False
        })
        assert response.status_code == 200
        assert response.json['announcement']['title'] == 'Updated Title'
        
        # Path 3: Delete announcement
        response = client.delete(f'/api/announcements/{announcement_id}')
        assert response.status_code == 200