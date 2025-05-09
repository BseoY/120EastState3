def test_logging_levels(client):
    resp = client.get("/api/test/log")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "Logging Test Success" in data.get("message", "")