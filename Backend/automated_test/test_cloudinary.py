def test_cloudinary_connection(client):
    resp = client.get("/api/test/cloudinary")
    assert resp.status_code == 200
    data = resp.get_json()
    # expecting cloud_name & api_key fields
    assert data.get("cloud_name")
    assert data.get("api_key")