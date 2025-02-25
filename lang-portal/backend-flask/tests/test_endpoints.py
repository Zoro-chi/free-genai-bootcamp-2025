# import pytest
# from flask import json

# def test_pagination(client):
#     """Test pagination requirements"""
#     response = client.get('/words?page=1&per_page=10')
#     print("GET /words?page=1&per_page=10 response:", response.get_json())
#     assert response.status_code == 200
#     data = response.get_json()
#     assert 'current_page' in data
#     assert 'total_pages' in data
#     assert len(data['words']) <= 10

# def test_word_group_association(client):
#     """Test word-group associations"""
#     # Create test data
#     word_data = {
#         'kanji': '犬',
#         'romaji': 'inu',
#         'english': 'dog'
#     }
#     group_data = {'name': 'Animals'}
    
#     # Create word and group
#     word_response = client.post('/words', json=word_data)
#     print("POST /words response:", word_response.get_json())
#     group_response = client.post('/groups', json=group_data)
#     print("POST /groups response:", group_response.get_json())
    
#     word_id = word_response.get_json()['id']
#     group_id = group_response.get_json()['id']
    
#     # Associate word with group
#     response = client.post(f'/groups/{group_id}/words/{word_id}')
#     print("POST /groups/:group_id/words/:word_id response:", response.get_json())
#     assert response.status_code == 200

# def test_study_session_tracking(client):
#     """Test study session tracking"""
#     # Create test session
#     session_data = {
#         'study_activity_id': 1,
#         'group_id': 1
#     }
#     response = client.post('/api/study-sessions', json=session_data)
#     print("POST /api/study-sessions response:", response.get_json())
#     assert response.status_code == 201
#     session_id = response.get_json()['id']
    
#     # Add word review
#     review_data = {
#         'word_id': 1,
#         'correct': True
#     }
#     response = client.post(
#         f'/api/study-sessions/{session_id}/reviews',
#         json=review_data
#     )
#     print("POST /api/study-sessions/:session_id/reviews response:", response.get_json())
#     assert response.status_code == 201

# def test_error_handling(client):
#     """Test error responses"""
#     # Test non-existent word
#     response = client.get('/words/999999')
#     print("GET /words/999999 response:", response.get_json())
#     assert response.status_code == 404
#     assert response.content_type == 'application/json'
    
#     # Test invalid input
#     response = client.post('/words', json={})
#     print("POST /words with invalid input response:", response.get_json())
#     assert response.status_code == 400
#     assert response.content_type == 'application/json'

# def test_groups_endpoints(client):
#     """Test all group-related endpoints return valid JSON"""
    
#     # Test GET /groups
#     response = client.get('/groups')
#     print("GET /groups response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert 'groups' in response.json
    
#     # If we have groups, test group-specific endpoints
#     groups = response.json['groups']
#     if groups:
#         group_id = groups[0]['id']
        
#         # Test GET /groups/:id
#         response = client.get(f'/groups/{group_id}')
#         print(f"GET /groups/{group_id} response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'id' in response.json
        
#         # Test GET /groups/:id/words
#         response = client.get(f'/groups/{group_id}/words')
#         print(f"GET /groups/{group_id}/words response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'words' in response.json
        
#         # Test GET /groups/:id/study_sessions
#         response = client.get(f'/groups/{group_id}/study_sessions')
#         print(f"GET /groups/{group_id}/study_sessions response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'study_sessions' in response.json

# def test_words_endpoints(client):
#     """Test all word-related endpoints return valid JSON"""
    
#     # Test GET /words
#     response = client.get('/words')
#     print("GET /words response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert 'words' in response.json
    
#     # If we have words, test word-specific endpoints
#     words = response.json['words']
#     if words:
#         word_id = words[0]['id']
        
#         # Test GET /words/:id
#         response = client.get(f'/words/{word_id}')
#         print(f"GET /words/{word_id} response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'word' in response.json

# def test_study_sessions_endpoints(client):
#     """Test all study session-related endpoints return valid JSON"""
    
#     # Test GET /api/study-sessions
#     response = client.get('/api/study-sessions')
#     print("GET /api/study-sessions response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert 'items' in response.json
    
#     # Test POST /api/study-sessions/reset
#     response = client.post('/api/study-sessions/reset')
#     print("POST /api/study-sessions/reset response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert 'message' in response.json

# def test_study_activities_endpoints(client):
#     """Test all study activity-related endpoints return valid JSON"""
    
#     # Test GET /api/study-activities
#     response = client.get('/api/study-activities')
#     print("GET /api/study-activities response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert isinstance(response.json, list)
    
#     # If we have activities, test activity-specific endpoints
#     activities = response.json
#     if activities:
#         activity_id = activities[0]['id']
        
#         # Test GET /api/study-activities/:id
#         response = client.get(f'/api/study-activities/{activity_id}')
#         print(f"GET /api/study-activities/{activity_id} response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'id' in response.json
        
#         # Test GET /api/study-activities/:id/sessions
#         response = client.get(f'/api/study-activities/{activity_id}/sessions')
#         print(f"GET /api/study-activities/{activity_id}/sessions response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'items' in response.json
        
#         # Test GET /api/study-activities/:id/launch
#         response = client.get(f'/api/study-activities/{activity_id}/launch')
#         print(f"GET /api/study-activities/{activity_id}/launch response:", response.get_json())
#         assert response.content_type == 'application/json'
#         assert 'activity' in response.json

# def test_dashboard_endpoints(client):
#     """Test all dashboard-related endpoints return valid JSON"""
    
#     # Test GET /dashboard/recent-session
#     response = client.get('/dashboard/recent-session')
#     print("GET /dashboard/recent-session response:", response.get_json())
#     assert response.content_type == 'application/json'
    
#     # Test GET /dashboard/stats
#     response = client.get('/dashboard/stats')
#     print("GET /dashboard/stats response:", response.get_json())
#     assert response.content_type == 'application/json'
#     assert 'total_vocabulary' in response.json


import pytest
from flask import json

@pytest.fixture
def setup_database(client):
    # Create necessary data
    # Create groups
    group_data = {'name': 'Animals'}
    client.post('/groups', json=group_data)
    
    # Create words
    word_data = {
        'kanji': '犬',
        'romaji': 'inu',
        'english': 'dog',
        'parts': '[]'
    }
    client.post('/words', json=word_data)
    
    # Create study activities
    study_activity_data = {'name': 'Vocabulary Practice'}
    client.post('/api/study-activities', json=study_activity_data)
    
    # Create study sessions
    study_session_data = {
        'study_activity_id': 1,
        'group_id': 1
    }
    client.post('/api/study-sessions', json=study_session_data)

    yield

    # Clean up the database if necessary
    # client.delete('/api/cleanup')

def test_pagination(client, setup_database):
    """Test pagination requirements"""
    response = client.get('/words?page=1&per_page=10')
    print("GET /words?page=1&per_page=10 response:", response.get_json())
    assert response.status_code == 200
    data = response.get_json()
    assert 'current_page' in data
    assert 'total_pages' in data
    assert len(data['words']) <= 10

def test_word_group_association(client, setup_database):
    """Test word-group associations"""
    # Create test data
    word_data = {
        'kanji': '犬',
        'romaji': 'inu',
        'english': 'dog'
    }
    group_data = {'name': 'Animals'}
    
    # Create word and group
    word_response = client.post('/words', json=word_data)
    print("POST /words response:", word_response.get_json())
    group_response = client.post('/groups', json=group_data)
    print("POST /groups response:", group_response.get_json())
    
    word_id = word_response.get_json()['id']
    group_id = group_response.get_json()['id']
    
    # Associate word with group
    response = client.post(f'/groups/{group_id}/words/{word_id}')
    print("POST /groups/:group_id/words/:word_id response:", response.get_json())
    assert response.status_code == 200

def test_study_session_tracking(client, setup_database):
    """Test study session tracking"""
    # Create test session
    session_data = {
        'study_activity_id': 1,
        'group_id': 1
    }
    response = client.post('/api/study-sessions', json=session_data)
    print("POST /api/study-sessions response:", response.get_json())
    assert response.status_code == 201
    session_id = response.get_json()['id']
    
    # Add word review
    review_data = {
        'word_id': 1,
        'correct': True
    }
    response = client.post(
        f'/api/study-sessions/{session_id}/reviews',
        json=review_data
    )
    print("POST /api/study-sessions/:session_id/reviews response:", response.get_json())
    assert response.status_code == 201

def test_error_handling(client, setup_database):
    """Test error responses"""
    # Test non-existent word
    response = client.get('/words/999999')
    print("GET /words/999999 response:", response.get_json())
    assert response.status_code == 404
    assert response.content_type == 'application/json'
    
    # Test invalid input
    response = client.post('/words', json={})
    print("POST /words with invalid input response:", response.get_json())
    assert response.status_code == 400
    assert response.content_type == 'application/json'

def test_groups_endpoints(client, setup_database):
    """Test all group-related endpoints return valid JSON"""
    
    # Test GET /groups
    response = client.get('/groups')
    print("GET /groups response:", response.get_json())
    assert response.content_type == 'application/json'
    assert 'groups' in response.json
    
    # If we have groups, test group-specific endpoints
    groups = response.json['groups']
    if groups:
        group_id = groups[0]['id']
        
        # Test GET /groups/:id
        response = client.get(f'/groups/{group_id}')
        print(f"GET /groups/{group_id} response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'id' in response.json
        
        # Test GET /groups/:id/words
        response = client.get(f'/groups/{group_id}/words')
        print(f"GET /groups/{group_id}/words response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'words' in response.json
        
        # Test GET /groups/:id/study_sessions
        response = client.get(f'/groups/{group_id}/study_sessions')
        print(f"GET /groups/{group_id}/study_sessions response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'study_sessions' in response.json

def test_words_endpoints(client, setup_database):
    """Test all word-related endpoints return valid JSON"""
    
    # Test GET /words
    response = client.get('/words')
    print("GET /words response:", response.get_json())
    assert response.content_type == 'application/json'
    assert 'words' in response.json
    
    # If we have words, test word-specific endpoints
    words = response.json['words']
    if words:
        word_id = words[0]['id']
        
        # Test GET /words/:id
        response = client.get(f'/words/{word_id}')
        print(f"GET /words/{word_id} response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'word' in response.json

def test_study_sessions_endpoints(client, setup_database):
    """Test all study session-related endpoints return valid JSON"""
    
    # Test GET /api/study-sessions
    response = client.get('/api/study-sessions')
    print("GET /api/study-sessions response:", response.get_json())
    assert response.content_type == 'application/json'
    assert 'items' in response.json
    
    # Test POST /api/study-sessions/reset
    response = client.post('/api/study-sessions/reset')
    print("POST /api/study-sessions/reset response:", response.get_json())
    assert response.content_type == 'application/json'
    assert 'message' in response.json

def test_study_activities_endpoints(client, setup_database):
    """Test all study activity-related endpoints return valid JSON"""
    
    # Test GET /api/study-activities
    response = client.get('/api/study-activities')
    print("GET /api/study-activities response:", response.get_json())
    assert response.content_type == 'application/json'
    assert isinstance(response.json, list)
    
    # If we have activities, test activity-specific endpoints
    activities = response.json
    if activities:
        activity_id = activities[0]['id']
        
        # Test GET /api/study-activities/:id
        response = client.get(f'/api/study-activities/{activity_id}')
        print(f"GET /api/study-activities/{activity_id} response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'id' in response.json
        
        # Test GET /api/study-activities/:id/sessions
        response = client.get(f'/api/study-activities/{activity_id}/sessions')
        print(f"GET /api/study-activities/{activity_id}/sessions response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'items' in response.json
        
        # Test GET /api/study-activities/:id/launch
        response = client.get(f'/api/study-activities/{activity_id}/launch')
        print(f"GET /api/study-activities/{activity_id}/launch response:", response.get_json())
        assert response.content_type == 'application/json'
        assert 'activity' in response.json

def test_dashboard_endpoints(client, setup_database):
    """Test all dashboard-related endpoints return valid JSON"""
    
    # Test GET /dashboard/recent-session
    response = client.get('/dashboard/recent-session')
    print("GET /dashboard/recent-session response:", response.get_json())
    assert response.content_type == 'application/json'
    
    # Test GET /dashboard/stats
    response = client.get('/dashboard/stats')
    print("GET /dashboard/stats response:", response.get_json())
    assert response.content_type == 'application/json'
    assert 'total_vocabulary' in response.json