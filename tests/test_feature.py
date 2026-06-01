import pytest
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.feature_extractor import extractor


def test_empty_extractor_returns_empty():
    ex = extractor()
    assert ex.features() == {}


def test_add_event_increments_ip_count():
    ex = extractor()
    ex.add_event("192.168.1.1", 512, "/api")
    assert ex.ip_counts["192.168.1.1"] == 1


def test_add_multiple_events_same_ip():
    ex = extractor()
    ex.add_event("10.0.0.1", 512, "/api")
    ex.add_event("10.0.0.1", 512, "/api")
    ex.add_event("10.0.0.1", 512, "/api")
    assert ex.ip_counts["10.0.0.1"] == 3


def test_features_returns_correct_keys():
    ex = extractor()
    for _ in range(5):
        ex.add_event("192.168.1.1", 512, "/api")
    features = ex.features()
    assert "requests_per_sec"  in features
    assert "unique_ips"        in features
    assert "top_k_avg"         in features
    assert "avg_payload"       in features
    assert "endpoint_entropy"  in features
    assert "event_count"       in features


def test_unique_ip_count():
    ex = extractor()
    ex.add_event("1.1.1.1", 100, "/a")
    ex.add_event("2.2.2.2", 100, "/b")
    ex.add_event("3.3.3.3", 100, "/c")
    features = ex.features()
    assert features["unique_ips"] == 3