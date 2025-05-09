import json

def test_fixtures_route(client):
    resp = client.post("/api/test/fixtures")
    assert resp.status_code == 200
    data = resp.get_json()
    # expecting a dict of created IDs
    assert isinstance(data.get("created_ids"), dict)