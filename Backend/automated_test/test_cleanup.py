def test_cleanup_route(client, admin_token):
    # include the Bearer token so require_roles('admin') passes
    resp = client.delete(
        "/api/test/cleanup",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 200, f"got {resp.status_code}, body={resp.get_data(as_text=True)}"