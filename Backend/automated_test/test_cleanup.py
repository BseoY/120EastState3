def test_cleanup_route(client, admin_token):
    resp = client.delete(
        "/api/test/cleanup",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Print full error details if test fails
    if resp.status_code != 200:
        print("\n=== AUTHENTICATION ERROR DETAILS ===")
        print(f"Status Code: {resp.status_code}")
        print(f"Response Body: {resp.get_json()}")
        print(f"Request Headers: {dict(resp.request.headers)}")
        print(f"Token Used: {admin_token}")
    
    assert resp.status_code == 200