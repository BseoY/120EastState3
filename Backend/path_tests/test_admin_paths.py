import pytest
from database import User, Post, Announcement, db

class TestAdminPaths:
    def test_user_management_paths(self, client, auth):
        """Test admin user management paths"""
        # 1. Admin login
        auth.admin_login()
        
        # 2. Get all users
        response = client.get('/api/admin/users')
        assert response.status_code == 200
        assert len(response.json) >= 2
        
        # Find a non-admin user (ensure one exists)
        regular_users = [u for u in response.json if u['role'] != 'admin']
        if not regular_users:
            # Create a test non-admin user if none exists
            test_user = User(
                email='regular@test.com',
                role='user',
                google_id='test_regular_user'
            )
            db.session.add(test_user)
            db.session.commit()
            regular_users = [{'id': test_user.id}]
        
        user_id = regular_users[0]['id']
          
        
        # Verify non-admin can't access admin endpoints
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