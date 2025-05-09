import pytest
from io import BytesIO
from database import Media

class TestMediaPaths:
    def test_media_upload_paths(self, client, auth):
        """Test all media upload paths"""
        auth.login()
        
        # Path 1: Successful image upload
        test_file = (BytesIO(b'test image'), 'test.jpg')
        response = client.post('/api/upload', 
                            data={'file': test_file},
                            content_type='multipart/form-data')
        assert response.status_code == 200
        assert 'image_url' in response.json
        
        # Path 2: Video upload
        test_video = (BytesIO(b'test video'), 'test.mp4')
        response = client.post('/api/upload', 
                             data={'file': test_video},
                             content_type='multipart/form-data')
        assert response.status_code == 200
        assert 'video_url' in response.json
        
        # Path 3: Invalid file type
        test_invalid = (BytesIO(b'test'), 'test.exe')
        response = client.post('/api/upload', 
                             data={'file': test_invalid},
                             content_type='multipart/form-data')
        assert response.status_code == 400
        
        # Path 4: No file provided
        response = client.post('/api/upload')
        assert response.status_code == 400

    def test_media_with_posts_paths(self, client, auth):
        """Test media handling within posts"""
        auth.login()
        
        # Path 1: Post with multiple media types
        image_file = (BytesIO(b'test image'), 'test.jpg')
        video_file = (BytesIO(b'test video'), 'test.mp4')
        response = client.post('/api/posts', data={
            'title': 'Mixed Media',
            'content': 'Test',
            'media_0': image_file,
            'media_1': video_file,
            'media_0_caption': 'Image caption',
            'media_1_caption': 'Video caption'
        }, content_type='multipart/form-data')
        
        assert response.status_code == 201
        media = response.json['post']['media']
        assert len(media) == 2
        assert any(m['media_type'] == 'image' for m in media)
        assert any(m['media_type'] == 'video' for m in media)