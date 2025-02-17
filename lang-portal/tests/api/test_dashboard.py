from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_dashboard_stats(db):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "success_rate" in data["data"]
    assert "total_sessions" in data["data"]
    assert "active_groups" in data["data"]
    assert "current_streak" in data["data"] 