import pytest
from datetime import datetime, UTC
from io import BytesIO
from database import Post, Tag, Media

class TestPostPaths:
    def test_post_creation_paths(self, client, auth):
        """Test all paths through post creation"""
        auth.login()
        
        # Path 1: Successful text post
        response = client.post('/api/posts', data={
            'title': 'Test Post',
            'content': 'Test content',
            'tag': 'new-tag'
        })
        assert response.status_code == 201
        assert 'Post added successfully' in response.json['message']
        
        # Path 2: Post with media
        test_file = (BytesIO(b'test content'), 'test.jpg')
        response = client.post('/api/posts', data={
            'title': 'Media Post',
            'content': 'With image',
            'media_0': test_file,
            'media_0_caption': 'Test caption'
        }, content_type='multipart/form-data')
        assert response.status_code == 201
        assert len(response.json['post']['media']) == 1
        
        # Path 3: Missing required field
        response = client.post('/api/posts', data={
            'content': 'No title'
        })
        assert response.status_code == 400
        assert 'Title is required' in response.json['error']
        
        # Path 4: Too many media files (limit is 5)
        files = {f'media_{i}': (BytesIO(b'test'), f'test{i}.jpg') for i in range(6)}
        response = client.post('/api/posts', 
            data={**files, 'title': 'Too many files', 'content': 'Test'},
            content_type='multipart/form-data')
        assert response.status_code == 201  # Should accept but only process 5
        assert len(response.json['post']['media']) == 5

    def test_post_approval_paths(self, client, auth, test_post):
        """Test post approval workflow paths"""
        # Path 1: Admin approves post
        auth.admin_login()
        response = client.post(f'/api/admin/posts/{test_post}/approve')
        assert response.status_code == 200
        assert 'approved' in response.json['message']
        
        # Verify status changed
        response = client.get(f'/api/posts/{test_post}')
        assert response.json['status'] == 'approved'
        
        # Path 2: Admin denies with feedback
        auth.admin_login()
        response = client.post(f'/api/admin/posts/{test_post}/deny',
                             json={'feedback': 'Needs improvement'})
        assert response.status_code == 200
        assert 'denied' in response.json['message']
        
        # Path 3: Regular user tries to approve (should fail)
        auth.login()
        response = client.post(f'/api/admin/posts/{test_post}/approve')
        assert response.status_code == 403

    def test_post_deletion_paths(self, client, auth, test_post):
        """Test post deletion paths"""
        # Path 1: Author deletes own post
        auth.login()
        response = client.delete(f'/api/user/posts/{test_post}')
        assert response.status_code == 200
        
        # Path 2: Admin deletes any post
        auth.admin_login()
        response = client.delete(f'/api/admin/posts/{test_post}')
        assert response.status_code == 200
        