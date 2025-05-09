def test_database_connection(client):
    resp = client.get("/api/test/database")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "Success" in data.get("message", "")