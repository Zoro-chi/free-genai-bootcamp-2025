from flask import Flask, g, jsonify
from flask_cors import CORS

from lib.db import Db

import routes.words
import routes.groups
import routes.study_sessions
import routes.dashboard
import routes.study_activities

def create_app(test_config=None):
    app = Flask(__name__)
    
    if test_config is None:
        app.config.from_mapping(
            DATABASE='words.db'
        )
    else:
        app.config.update(test_config)
    
    # Initialize database first since we need it for CORS configuration
    app.db = Db(database=app.config['DATABASE'])
    
    # Initialize database tables if they don't exist
    with app.app_context():
        try:
            app.db.init(app)
            app.logger.info('Database initialized successfully')
        except Exception as e:
            app.logger.error(f'Database initialization failed: {str(e)}')
    
    # Configure CORS
    CORS(app, resources={r"/*": {
    "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8082", "http://127:0.0.1:8082"], 
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    
}})
    
    # Define a route for the root URL
    @app.route('/')
    def index():
        return jsonify({"message": "Welcome to the Language Portal API"})

    # Close database connection
    @app.teardown_appcontext
    def close_db(exception):
        app.db.close()

    # load routes -----------
    routes.words.load(app)
    routes.groups.load(app)
    routes.study_sessions.load(app)
    routes.dashboard.load(app)
    routes.study_activities.load(app)
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)