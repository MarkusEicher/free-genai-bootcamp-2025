"""Tests for cache metrics collection."""
import pytest
from datetime import datetime, timedelta
from app.core.metrics import CacheMetrics
import sys

@pytest.fixture
def metrics():
    """Create a fresh metrics instance for each test."""
    return CacheMetrics()

def test_hit_ratio_calculation(metrics):
    """Test hit ratio calculation."""
    metrics.record_hit(1.0)
    metrics.record_hit(1.0)
    metrics.record_miss(2.0)
    assert metrics.hit_ratio == 2/3

def test_response_times(metrics):
    """Test response time statistics."""
    times = [1.0, 2.0, 3.0, 4.0, 5.0]
    for t in times:
        metrics.record_hit(t)
    
    stats = metrics.get_response_times()
    assert stats["avg"] == 3.0
    assert stats["min"] == 1.0
    assert stats["max"] == 5.0
    assert stats["median"] == 3.0

def test_privacy_metrics(metrics):
    """Test privacy-related metrics."""
    # Record some sanitizations and violations
    for _ in range(8):
        metrics.record_sanitization()
    for _ in range(2):
        metrics.record_privacy_violation()
    
    assert metrics.get_sanitization_rate() == 0.8

def test_cleanup_tracking(metrics):
    """Test cleanup statistics tracking."""
    metrics.record_cleanup(5, 1000)
    metrics.record_cleanup(3, 500)
    
    stats = metrics.get_cleanup_stats()
    assert stats["count"] == 2
    assert stats["total_entries_cleaned"] == 8
    assert stats["total_size_cleaned"] == 1500
    assert isinstance(stats["last_cleanup"], str)

def test_storage_utilization(metrics, monkeypatch):
    """Test storage utilization calculation."""
    # Mock MAX_CACHE_SIZE setting
    monkeypatch.setattr("app.core.config.settings.MAX_CACHE_SIZE", 1000)
    
    metrics.total_size = 250
    assert metrics.storage_utilization == 0.25

def test_response_time_window(metrics):
    """Test response time rolling window."""
    # Add more than max_response_times entries
    window_size = metrics._max_response_times
    for i in range(window_size + 10):
        metrics.record_hit(float(i))
    
    # Check window size is maintained
    assert len(metrics._response_times) == window_size
    # Check oldest entries were removed
    assert min(metrics._response_times) == 10.0

def test_thread_safety(metrics):
    """Test thread safety of metrics collection."""
    import threading
    import random
    
    def worker():
        for _ in range(100):
            if random.random() > 0.5:
                metrics.record_hit(1.0)
            else:
                metrics.record_miss(1.0)
    
    threads = [threading.Thread(target=worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    total = metrics.hit_count + metrics.miss_count
    assert total == 500  # 5 threads * 100 operations

def test_metrics_to_dict(metrics):
    """Test conversion of metrics to dictionary."""
    # Record some test data
    metrics.record_hit(1.0)
    metrics.record_miss(2.0)
    metrics.record_sanitization()
    metrics.record_cleanup(1, 100)
    
    data = metrics.to_dict()
    
    # Check structure
    assert "performance" in data
    assert "privacy" in data
    assert "storage" in data
    
    # Check specific values
    assert data["performance"]["hit_ratio"] == 0.5
    assert data["privacy"]["sanitizations"] == 1
    assert data["storage"]["total_size"] >= 0

def test_empty_metrics(metrics):
    """Test metrics behavior with no data."""
    assert metrics.hit_ratio == 0.0
    assert metrics.get_sanitization_rate() == 0.0
    assert metrics.get_response_times()["avg"] == 0.0

def test_negative_size_prevention(metrics):
    """Test prevention of negative sizes during cleanup."""
    metrics.total_size = 100
    metrics.entry_count = 5
    
    # Try to clean more than exists
    metrics.record_cleanup(10, 200)
    
    assert metrics.total_size == 0
    assert metrics.entry_count == 0

def test_metrics_reset(metrics):
    """Test metrics reset functionality."""
    # Record some activity
    metrics.record_hit(1.0)
    metrics.record_miss(2.0)
    metrics.record_sanitization()
    metrics.record_privacy_violation()
    metrics.record_cleanup(5, 1000)
    
    # Verify metrics were recorded
    assert metrics.hit_count > 0
    assert metrics.miss_count > 0
    
    # Reset metrics
    metrics.__init__()
    
    # Verify all metrics were reset
    assert metrics.hit_count == 0
    assert metrics.miss_count == 0
    assert metrics.privacy_violations == 0
    assert metrics.sanitization_count == 0
    assert metrics.cleanup_count == 0
    assert metrics.total_size == 0
    assert metrics.entry_count == 0
    assert len(metrics._response_times) == 0

def test_concurrent_cleanup_tracking(metrics):
    """Test concurrent cleanup operations tracking."""
    import threading
    import random
    import time
    
    def cleanup_worker():
        for _ in range(50):
            entries = random.randint(1, 10)
            size = random.randint(100, 1000)
            metrics.record_cleanup(entries, size)
            time.sleep(0.001)  # Simulate work
    
    # Start multiple cleanup workers
    threads = [threading.Thread(target=cleanup_worker) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Verify cleanup tracking
    stats = metrics.get_cleanup_stats()
    assert stats["count"] == 150  # 3 threads * 50 operations
    assert stats["total_entries_cleaned"] > 0
    assert stats["total_size_cleaned"] > 0
    assert isinstance(stats["last_cleanup"], str)

def test_response_time_statistics(metrics):
    """Test detailed response time statistics calculation."""
    # Add known response times
    test_times = [1.0, 2.0, 2.0, 3.0, 4.0, 5.0]
    for t in test_times:
        metrics.record_hit(t)
    
    stats = metrics.get_response_times()
    assert stats["avg"] == sum(test_times) / len(test_times)
    assert stats["min"] == min(test_times)
    assert stats["max"] == max(test_times)
    assert stats["median"] == 2.5  # Median of [1,2,2,3,4,5]

def test_metrics_thread_safety_mixed_operations(metrics):
    """Test thread safety with mixed operations."""
    import threading
    import random
    import time
    
    def mixed_worker():
        operations = [
            lambda: metrics.record_hit(random.random()),
            lambda: metrics.record_miss(random.random()),
            lambda: metrics.record_sanitization(),
            lambda: metrics.record_privacy_violation(),
            lambda: metrics.record_cleanup(1, 100)
        ]
        
        for _ in range(100):
            op = random.choice(operations)
            op()
            time.sleep(0.001)  # Simulate work
    
    # Run multiple threads with mixed operations
    threads = [threading.Thread(target=mixed_worker) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    
    # Verify metrics consistency
    metrics_data = metrics.to_dict()
    total_ops = (metrics.hit_count + metrics.miss_count + 
                 metrics.sanitization_count + metrics.privacy_violations +
                 metrics.cleanup_count)
    assert total_ops == 500  # 5 threads * 100 operations

def test_large_scale_metrics(metrics):
    """Test metrics behavior with large numbers of operations."""
    # Simulate large number of operations
    for i in range(10000):
        if i % 2 == 0:
            metrics.record_hit(1.0)
        else:
            metrics.record_miss(2.0)
        
        if i % 10 == 0:
            metrics.record_sanitization()
        if i % 100 == 0:
            metrics.record_privacy_violation()
        if i % 1000 == 0:
            metrics.record_cleanup(10, 1000)
    
    # Verify metrics accuracy with large numbers
    data = metrics.to_dict()
    assert data["performance"]["hit_ratio"] == 0.5  # Equal hits/misses
    assert data["performance"]["entry_count"] >= 0
    assert 0 <= data["privacy"]["sanitization_rate"] <= 1.0
    assert data["privacy"]["violations"] == 100  # Every 100th operation
    assert data["storage"]["cleanup"]["count"] == 10  # Every 1000th operation

def test_metrics_boundary_conditions(metrics):
    """Test metrics behavior at boundary conditions."""
    # Test with zero operations
    assert metrics.hit_ratio == 0.0
    assert metrics.storage_utilization == 0.0
    assert metrics.get_sanitization_rate() == 0.0
    
    # Test with single operation
    metrics.record_hit(1.0)
    assert metrics.hit_ratio == 1.0
    
    # Test with maximum values
    metrics.total_size = sys.maxsize
    metrics.entry_count = sys.maxsize
    assert 0 <= metrics.storage_utilization <= 1.0
    
    # Test with negative cleanup values (should be prevented)
    metrics.record_cleanup(-1, -100)
    assert metrics.total_size >= 0
    assert metrics.entry_count >= 0

def test_metrics_persistence(metrics, tmp_path):
    """Test metrics persistence and recovery."""
    import json
    import os
    
    # Record some metrics
    metrics.record_hit(1.0)
    metrics.record_miss(2.0)
    metrics.record_sanitization()
    
    # Save metrics to file
    metrics_file = tmp_path / "metrics.json"
    with open(metrics_file, "w") as f:
        json.dump(metrics.to_dict(), f)
    
    # Create new metrics instance
    new_metrics = CacheMetrics()
    
    # Load metrics from file
    with open(metrics_file, "r") as f:
        saved_data = json.load(f)
    
    # Verify metrics were preserved
    assert saved_data["performance"]["hit_ratio"] == metrics.hit_ratio
    assert saved_data["privacy"]["sanitization_rate"] == metrics.get_sanitization_rate()
    assert saved_data["storage"]["total_size"] == metrics.total_size 