import time

def test_response_time(client):
    """Test API response time requirements"""
    start_time = time.time()
    response = client.get('/words')
    end_time = time.time()
    
    response_time = end_time - start_time
    assert response_time < 0.5  # 500ms maximum response time
    assert response.status_code == 200