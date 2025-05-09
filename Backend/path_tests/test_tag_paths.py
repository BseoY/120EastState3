import pytest
from database import Tag

class TestTagPaths:
    def test_tag_management_paths(self, client, auth):
        """Test tag CRUD paths"""
        auth.admin_login()
        
        # Path 1: Create tag
        response = client.post('/api/admin/tags', json={
            'name': 'new-tag',
            'display_order': 1,
            'image_url': 'http://example.com/tag.jpg'
        })
        assert response.status_code == 201
        tag_id = response.json['id']
        
        # Path 2: Get all tags
        response = client.get('/api/tags')
        assert response.status_code == 200
        assert any(t['name'] == 'new-tag' for t in response.json)
        
        # Path 3: Update tag
        response = client.put(f'/api/admin/tags/{tag_id}', json={
            'name': 'updated-tag',
            'display_order': 2
        })
        assert response.status_code == 200
        assert response.json['name'] == 'updated-tag'
        
        # Path 4: Delete tag
        response = client.delete(f'/api/admin/tags/{tag_id}')
        assert response.status_code == 200