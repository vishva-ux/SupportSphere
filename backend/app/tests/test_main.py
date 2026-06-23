import pytest
from datetime import datetime, timedelta

def test_login_and_auth(client):
    # Test valid login
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@supportsphere.com", "password": "AdminSphere2026!"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Test invalid login
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@supportsphere.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401


def test_get_profile(client):
    # Login
    response = client.post(
        "/api/auth/login",
        json={"email": "employee@supportsphere.com", "password": "EmployeeSphere2026!"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "employee@supportsphere.com"
    assert user_data["role"] == "Employee"


def test_ticket_creation_and_sla(client):
    # Login as Employee
    response = client.post(
        "/api/auth/login",
        json={"email": "employee@supportsphere.com", "password": "EmployeeSphere2026!"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch Categories to get valid ID
    response = client.get("/api/tickets/categories/all", headers=headers)
    categories = response.json()
    vpn_category = next(c for c in categories if c["name"] == "VPN Issue")
    
    # Fetch Assets to get valid ID
    response = client.get("/api/assets", headers=headers)
    assets = response.json()
    asset_id = assets[0]["id"] if assets else None

    # Create Ticket (P1 Critical)
    ticket_payload = {
        "title": "VPN connection dropping hourly",
        "description": "Every time I connect, it drops exactly 60 minutes later.",
        "priority": "P1 Critical",
        "category_id": vpn_category["id"],
        "asset_id": asset_id
    }
    response = client.post("/api/tickets", json=ticket_payload, headers=headers)
    assert response.status_code == 201
    ticket = response.json()
    assert ticket["title"] == "VPN connection dropping hourly"
    assert ticket["status"] == "Open"
    
    # Assert SLA calculation (P1 Critical is min(2, base_hours), VPN is 4 hours, so 2 hours target)
    created_at = datetime.fromisoformat(ticket["created_at"].replace("Z", "+00:00"))
    sla_due_at = datetime.fromisoformat(ticket["sla_due_at"].replace("Z", "+00:00"))
    time_diff = sla_due_at - created_at
    assert abs(time_diff.total_seconds() - 7200) < 10  # roughly 2 hours (7200s)


def test_internal_comments_visibility(client):
    # Log in as Employee
    emp_login = client.post(
        "/api/auth/login",
        json={"email": "employee@supportsphere.com", "password": "EmployeeSphere2026!"}
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Log in as Support Engineer
    eng_login = client.post(
        "/api/auth/login",
        json={"email": "engineer@supportsphere.com", "password": "EngineerSphere2026!"}
    )
    eng_token = eng_login.json()["access_token"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}

    # Fetch Category ID
    response = client.get("/api/tickets/categories/all", headers=emp_headers)
    cat_id = response.json()[0]["id"]

    # Employee creates ticket
    response = client.post(
        "/api/tickets",
        json={
            "title": "Need new laptop adapter",
            "description": "My current charger is frayed.",
            "priority": "P3 Medium",
            "category_id": cat_id
        },
        headers=emp_headers
    )
    ticket_id = response.json()["id"]

    # Engineer adds internal comment
    response = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "Checked stockpile, we have charger Model X-24 in room 204.", "is_internal": True},
        headers=eng_headers
    )
    assert response.status_code == 200

    # Engineer adds public comment
    response = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "I am working on getting your charger, will update soon.", "is_internal": False},
        headers=eng_headers
    )
    assert response.status_code == 200

    # Engineer fetches comments (should see 2 comments)
    response = client.get(f"/api/tickets/{ticket_id}/comments", headers=eng_headers)
    assert len(response.json()) == 2

    # Employee fetches comments (should only see the public comment)
    response = client.get(f"/api/tickets/{ticket_id}/comments", headers=emp_headers)
    comments = response.json()
    assert len(comments) == 1
    assert comments[0]["content"] == "I am working on getting your charger, will update soon."
