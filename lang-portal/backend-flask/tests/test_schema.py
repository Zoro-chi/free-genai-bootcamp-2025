def test_database_schema(client):
    """Test database schema matches requirements"""
    tables = [
        'words',
        'groups',
        'words_groups',
        'study_activities',
        'study_sessions',
        'word_reviews'
    ]
    
    for table in tables:
        # Check if table exists
        cursor = client.application.db.cursor()
        result = cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table,)
        ).fetchone()
        assert result is not None, f"Table {table} does not exist"