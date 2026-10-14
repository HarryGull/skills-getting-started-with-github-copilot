import importlib
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient


app_module = importlib.import_module("src.app")


@pytest.fixture
def activities(monkeypatch):
    test_activities = {
        "Chess Club": {
            "description": "Practice chess",
            "schedule": "Fridays",
            "max_participants": 3,
            "participants": ["existing@example.com"],
        },
        "Soccer Team": {
            "description": "Practice soccer",
            "schedule": "Wednesdays",
            "max_participants": 2,
            "participants": [],
        },
    }
    monkeypatch.setattr(app_module, "activities", test_activities)
    return test_activities


@pytest.fixture
def client(activities):
    with TestClient(app_module.app) as test_client:
        yield test_client


def test_get_activities_returns_activity_details_and_participants(client):
    response = client.get("/activities")

    assert response.status_code == 200
    assert response.json()["Chess Club"] == {
        "description": "Practice chess",
        "schedule": "Fridays",
        "max_participants": 3,
        "participants": ["existing@example.com"],
    }


def test_signup_adds_participant_and_returns_updated_availability(client, activities):
    response = client.post(
        f"/activities/{quote('Chess Club', safe='')}/signup",
        params={"email": "new@example.com"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Signed up new@example.com for Chess Club",
        "participants": ["existing@example.com", "new@example.com"],
        "spots_left": 1,
    }
    assert activities["Chess Club"]["participants"] == [
        "existing@example.com",
        "new@example.com",
    ]


def test_signup_rejects_duplicate_participant_without_changing_activity(client, activities):
    response = client.post(
        f"/activities/{quote('Chess Club', safe='')}/signup",
        params={"email": "existing@example.com"},
    )

    assert response.status_code == 400
    assert activities["Chess Club"]["participants"] == ["existing@example.com"]


def test_signup_rejects_unknown_activity(client):
    response = client.post(
        "/activities/Unknown%20Activity/signup",
        params={"email": "new@example.com"},
    )

    assert response.status_code == 404


def test_remove_participant_updates_list_and_availability(client, activities):
    response = client.delete(
        f"/activities/{quote('Chess Club', safe='')}/participants",
        params={"email": "existing@example.com"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "message": "Unregistered existing@example.com from Chess Club",
        "participants": [],
        "spots_left": 3,
    }
    assert activities["Chess Club"]["participants"] == []


def test_remove_participant_rejects_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown%20Activity/participants",
        params={"email": "existing@example.com"},
    )

    assert response.status_code == 404


def test_remove_participant_rejects_unregistered_email_without_changing_activity(
    client, activities
):
    response = client.delete(
        f"/activities/{quote('Chess Club', safe='')}/participants",
        params={"email": "missing@example.com"},
    )

    assert response.status_code == 404
    assert activities["Chess Club"]["participants"] == ["existing@example.com"]
