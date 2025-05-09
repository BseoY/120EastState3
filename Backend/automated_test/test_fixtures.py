def test_fixtures_route(client):
    resp = client.post("/api/test/fixtures")
    assert resp.status_code == 201      # matches your current code
    data = resp.get_json()
    assert isinstance(data.get("user_id"), int)
    assert isinstance(data.get("tag_ids"), list)