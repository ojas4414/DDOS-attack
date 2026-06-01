import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.decision_engine import decide, DetectorFactory


def test_no_attack_returns_false():
    prediction = {"label": "normal", "confidence": 0.95}
    features   = {"requests_per_sec": 10, "unique_ips": 5,
                  "top_k_avg": 2, "avg_payload": 300,
                  "endpoint_entropy": 0.9, "event_count": 100}
    result = decide(prediction, features, [])
    assert result["is_attack"] == False
    assert result["ban_ips"]   == []


def test_low_confidence_returns_false():
    prediction = {"label": "attack", "confidence": 0.50}
    features   = {"requests_per_sec": 5000, "unique_ips": 8000,
                  "top_k_avg": 900, "avg_payload": 512,
                  "endpoint_entropy": 0.02, "event_count": 50000}
    result = decide(prediction, features, [])
    assert result["is_attack"] == False


def test_attack_bans_high_count_ips():
    prediction = {"label": "attack", "confidence": 0.97}
    features   = {"requests_per_sec": 5000, "unique_ips": 8000,
                  "top_k_avg": 900, "avg_payload": 512,
                  "endpoint_entropy": 0.02, "event_count": 50000}
    top_ips = [(892, "192.168.1.45"), (23, "10.0.0.1")]
    result = decide(prediction, features, top_ips)
    assert result["is_attack"] == True
    assert "192.168.1.45" in result["ban_ips"]
    assert "10.0.0.1" not in result["ban_ips"]


def test_factory_creates_ddos_detector():
    detector = DetectorFactory.create("ddos")
    assert detector.name == "ddos"


def test_factory_creates_slowloris_detector():
    detector = DetectorFactory.create("slowloris")
    assert detector.name == "slowloris"


def test_factory_unknown_type_raises():
    with pytest.raises(ValueError):
        DetectorFactory.create("unknown_attack")


def test_factory_available_returns_list():
    available = DetectorFactory.available()
    assert "ddos"       in available
    assert "slowloris"  in available
    assert "bruteforce" in available