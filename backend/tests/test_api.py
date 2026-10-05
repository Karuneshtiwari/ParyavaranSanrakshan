"""
Comprehensive Integration & Unit Test Suite for ParyavaranSanrakshan.
Tests Authentication, Role-Based Access Control, Waste Classifier Inference,
Smart Bin APIs, Predictions, and Collection Workflows.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from backend.app.main import app

client = TestClient(app)


def create_dummy_image():
    file = io.BytesIO()
    image = Image.new('RGB', (224, 224), color=(73, 109, 137))
    image.save(file, 'jpeg')
    file.seek(0)
    return file


# 1. Health Endpoint Test
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "ParyavaranSanrakshan"


# 2. Authentication Tests
def test_auth_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@paryavaran.org",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"


def test_auth_login_invalid():
    response = client.post("/api/auth/login", json={
        "email": "admin@paryavaran.org",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_auth_register_and_profile():
    test_email = f"user_test_{id(object())}@paryavaran.org"
    res = client.post("/api/auth/register", json={
        "name": "Integration Tester",
        "email": test_email,
        "password": "securepassword123",
        "role": "CITIZEN"
    })
    assert res.status_code == 201
    token = res.json()["access_token"]

    # Verify profile with token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email


# 3. Role Authorization Tests (Section 39)
def test_role_authorization_citizen_vs_admin():
    # Citizen login
    cit_res = client.post("/api/auth/login", json={
        "email": "citizen@paryavaran.org",
        "password": "citizen123"
    })
    cit_token = cit_res.json()["access_token"]

    # Citizen trying to create a bin (Admin only)
    create_res = client.post(
        "/api/bins",
        json={
            "bin_code": "B999",
            "location_name": "Unauthorized Area",
            "latitude": 13.0,
            "longitude": 80.0,
            "capacity": 100,
            "waste_type": "Mixed"
        },
        headers={"Authorization": f"Bearer {cit_token}"}
    )
    # Must be forbidden!
    assert create_res.status_code == 403


# 4. Waste Classification ML Inference Test (Section 19 & 39)
def test_waste_prediction_endpoint():
    img_file = create_dummy_image()
    response = client.post(
        "/api/waste/predict",
        files={"file": ("test_sample.jpg", img_file, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "predicted_class" in data
    assert "confidence" in data
    assert "category" in data
    assert "recommendation" in data
    assert data["confidence"] > 0.0


# 5. Smart Bin Network & Prediction Retrieval (Section 22 & 39)
def test_bins_retrieval_and_filtering():
    response = client.get("/api/bins")
    assert response.status_code == 200
    bins = response.json()
    assert len(bins) >= 20  # All 20 virtual bins

    # Filter test
    crit_res = client.get("/api/bins?status=Critical")
    assert crit_res.status_code == 200
    for b in crit_res.json():
        assert b["status"] == "Critical"


# 6. Collection Clearance Workflow (Section 25 & 39)
def test_collection_clearance():
    # Collector login
    col_res = client.post("/api/auth/login", json={
        "email": "collector@paryavaran.org",
        "password": "collector123"
    })
    col_token = col_res.json()["access_token"]

    # Mark bin 2 (Food Court) collected
    res = client.post(
        "/api/collections",
        json={"bin_id": 2, "after_fill": 10.0},
        headers={"Authorization": f"Bearer {col_token}"}
    )
    assert res.status_code == 201
    col_data = res.json()
    assert col_data["after_fill"] == 10.0
    assert col_data["status"] == "Completed"

    # Verify bin state was reset in database
    bin2_res = client.get("/api/bins/2")
    assert bin2_res.status_code == 200
    assert bin2_res.json()["current_fill"] == 10.0
    assert bin2_res.json()["status"] == "Normal"


# 7. Model Performance Metrics Endpoint (Section 27 & 39)
def test_model_metrics_availability():
    res = client.get("/api/models/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "waste_classifier" in data
    assert "bin_regressor" in data
    assert "overflow_classifier" in data
    assert data["waste_classifier"]["accuracy"] > 0.70
    assert data["bin_regressor"]["overall"]["r2"] > 0.50
    assert data["overflow_classifier"]["accuracy"] > 0.90
