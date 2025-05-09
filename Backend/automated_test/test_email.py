def test_email_sending(client):
    resp = client.get("/api/test/email")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "Email Test Success" in data.get("message", "")