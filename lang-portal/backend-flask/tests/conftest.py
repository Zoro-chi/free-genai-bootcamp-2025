import pytest
from app import create_app
import os

@pytest.fixture
def app():
    test_config = {
        'DATABASE': 'test_words.db',
        'TESTING': True
    }
    app = create_app(test_config)
    
    # Set up test database
    with app.app_context():
        app.db.init(app)
    
    yield app
    
    # Clean up - remove test database
    os.unlink(test_config['DATABASE'])

@pytest.fixture
def client(app):
    return app.test_client()