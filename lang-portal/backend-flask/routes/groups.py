from flask import request, jsonify, g
from flask_cors import cross_origin
import json

def load(app):
  @app.route('/groups', methods=['GET'])
  @cross_origin()
  def get_groups():
    try:
      cursor = app.db.cursor()

      # Get the current page number from query parameters (default is 1)
      page = int(request.args.get('page', 1))
      groups_per_page = 10
      offset = (page - 1) * groups_per_page

      # Get sorting parameters from the query string
      sort_by = request.args.get('sort_by', 'name')  # Default to sorting by 'name'
      order = request.args.get('order', 'asc')  # Default to ascending order

      # Validate sort_by and order
      valid_columns = ['name', 'words_count']
      if sort_by not in valid_columns:
        sort_by = 'name'
      if order not in ['asc', 'desc']:
        order = 'asc'

      # Query to fetch groups with sorting and the cached word count
      cursor.execute(f'''
        SELECT id, name, words_count
        FROM groups
        ORDER BY {sort_by} {order}
        LIMIT ? OFFSET ?
      ''', (groups_per_page, offset))

      groups = cursor.fetchall()

      # Query the total number of groups
      cursor.execute('SELECT COUNT(*) FROM groups')
      total_groups = cursor.fetchone()[0]
      total_pages = (total_groups + groups_per_page - 1) // groups_per_page

      # Format the response
      groups_data = []
      for group in groups:
        groups_data.append({
          "id": group["id"],
          "group_name": group["name"],
          "word_count": group["words_count"]
        })

      # Return groups and pagination metadata
      return jsonify({
        'groups': groups_data,
        'total_pages': total_pages,
        'current_page': page
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/groups/<int:id>/words', methods=['GET'])
  @cross_origin()
  def get_group_words(id):
    try:
      cursor = app.db.cursor()

      # Get the current page number from query parameters (default is 1)
      page = int(request.args.get('page', 1))
      words_per_page = 10
      offset = (page - 1) * words_per_page

      # Get sorting parameters from the query string
      sort_by = request.args.get('sort_by', 'kanji')  # Default to sorting by 'kanji'
      order = request.args.get('order', 'asc')  # Default to ascending order

      # Validate sort_by and order
      valid_columns = ['kanji', 'romaji', 'english', 'correct_count', 'wrong_count']
      if sort_by not in valid_columns:
        sort_by = 'kanji'
      if order not in ['asc', 'desc']:
        order = 'asc'

      # Query to fetch words for this group
      cursor.execute(f'''
        SELECT w.id, w.kanji, w.romaji, w.english,
            COALESCE(wr.correct_count, 0) as correct_count,
            COALESCE(wr.wrong_count, 0) as wrong_count
        FROM words w
        JOIN words_groups wg ON w.id = wg.word_id
        LEFT JOIN word_reviews wr ON w.id = wr.word_id
        WHERE wg.group_id = ?
        ORDER BY {sort_by} {order}
        LIMIT ? OFFSET ?
      ''', (id, words_per_page, offset))
      
      words = cursor.fetchall()

      # Get total words count for pagination
      cursor.execute('''
        SELECT COUNT(*) 
        FROM words_groups 
        WHERE group_id = ?
      ''', (id,))
      total_words = cursor.fetchone()[0]
      total_pages = (total_words + words_per_page - 1) // words_per_page

      # Format the response
      words_data = []
      for word in words:
        words_data.append({
          "id": word["id"],
          "kanji": word["kanji"],
          "romaji": word["romaji"],
          "english": word["english"],
          "correct_count": word["correct_count"],
          "wrong_count": word["wrong_count"]
        })

      # Return words and pagination metadata
      return jsonify({
        'words': words_data,
        'total_pages': total_pages,
        'current_page': page,
        'total_words': total_words
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500
    finally:
      app.db.close()
      
  @app.route('/api/groups/<int:id>/words/raw', methods=['GET'])
  @cross_origin()
  def get_group_words_raw(id):
    try:
      cursor = app.db.cursor()

      # First, check if the group exists
      cursor.execute('SELECT name FROM groups WHERE id = ?', (id,))
      group = cursor.fetchone()
      if not group:
        return jsonify({"error": "Group not found"}), 404

      # SQL query to fetch words along with group information
      cursor.execute('''
        SELECT g.id as group_id, g.name as group_name, w.*
        FROM groups g
        JOIN words_groups wg ON g.id = wg.group_id
        JOIN words w ON w.id = wg.word_id
        WHERE g.id = ?;
      ''', (id,))
      
      data = cursor.fetchall()
      
      # Format the response
      result = {
        "group_id": id,
        "group_name": data[0]["group_name"] if data else group["name"],
        "words": []
      }
      
      for row in data:
        word = {
          "id": row["id"],
          "kanji": row["kanji"],
          "romaji": row["romaji"],
          "english": row["english"],
          "parts": json.loads(row["parts"])  # Deserialize 'parts' field
        }
        result["words"].append(word)
      
      return jsonify(result)
    except Exception as e:
      return jsonify({"error": str(e)}), 500

  @app.route('/groups/<int:id>/study_sessions', methods=['GET'])
  @cross_origin()
  def get_group_study_sessions(id):
    try:
      cursor = app.db.cursor()
      
      # Get pagination parameters
      page = int(request.args.get('page', 1))
      sessions_per_page = 10
      offset = (page - 1) * sessions_per_page

      # Get sorting parameters
      sort_by = request.args.get('sort_by', 'created_at')
      order = request.args.get('order', 'desc')  # Default to newest first

      # Map frontend sort keys to database columns
      sort_mapping = {
        'startTime': 'created_at',
        'endTime': 'last_activity_time',
        'activityName': 'a.name',
        'groupName': 'g.name',
        'reviewItemsCount': 'review_count'
      }

      # Use mapped sort column or default to created_at
      sort_column = sort_mapping.get(sort_by, 'created_at')

      # Get total count for pagination
      cursor.execute('''
        SELECT COUNT(*)
        FROM study_sessions
        WHERE group_id = ?
      ''', (id,))
      total_sessions = cursor.fetchone()[0]
      total_pages = (total_sessions + sessions_per_page - 1) // sessions_per_page

      # Get study sessions for this group with dynamic calculations
      cursor.execute(f'''
        SELECT 
          s.id,
          s.group_id,
          s.study_activity_id,
          s.created_at as start_time,
          (
            SELECT MAX(created_at)
            FROM word_review_items
            WHERE study_session_id = s.id
          ) as last_activity_time,
          a.name as activity_name,
          g.name as group_name,
          (
            SELECT COUNT(*)
            FROM word_review_items
            WHERE study_session_id = s.id
          ) as review_count
        FROM study_sessions s
        JOIN study_activities a ON s.study_activity_id = a.id
        JOIN groups g ON s.group_id = g.id
        WHERE s.group_id = ?
        ORDER BY {sort_column} {order}
        LIMIT ? OFFSET ?
      ''', (id, sessions_per_page, offset))
      
      sessions = cursor.fetchall()
      sessions_data = []
      
      for session in sessions:
        # If there's no last_activity_time, use start_time + 30 minutes
        end_time = session["last_activity_time"]
        if not end_time:
            end_time = cursor.execute('SELECT datetime(?, "+30 minutes")', (session["start_time"],)).fetchone()[0]
        
        sessions_data.append({
          "id": session["id"],
          "group_id": session["group_id"],
          "group_name": session["group_name"],
          "study_activity_id": session["study_activity_id"],
          "activity_name": session["activity_name"],
          "start_time": session["start_time"],
          "end_time": end_time,
          "review_items_count": session["review_count"]
        })

      return jsonify({
        'study_sessions': sessions_data,
        'total_pages': total_pages,
        'current_page': page
      })
    except Exception as e:
      return jsonify({"error": str(e)}), 500
    
  @app.route('/groups/<int:group_id>', methods=['GET'])
  @cross_origin()
  def get_group(group_id):
      try:
          cursor = app.db.cursor()
          cursor.execute('''
              SELECT g.id, g.name, COUNT(wg.word_id) as total_word_count
              FROM groups g
              LEFT JOIN words_groups wg ON g.id = wg.group_id
              WHERE g.id = ?
              GROUP BY g.id
          ''', (group_id,))
          
          group = cursor.fetchone()
          
          if not group:
              return jsonify({"error": "Group not found"}), 404
          
          return jsonify({
              "id": group["id"],
              "name": group["name"],
              "stats": {
                  "total_word_count": group["total_word_count"]
              }
          })
      except Exception as e:
          return jsonify({"error": str(e)}), 500
      finally:
          app.db.close()
          
  @app.route('/groups/<int:group_id>/words/<int:word_id>', methods=['POST'])
  @cross_origin()
  def add_word_to_group(group_id, word_id):
      try:
          cursor = app.db.cursor()
          
          # Check if the group exists
          cursor.execute('SELECT id FROM groups WHERE id = ?', (group_id,))
          found_group = cursor.fetchone()
          if not found_group:
              return jsonify({"error": "Group not found"}), 404
          
          # Check if the word exists
          cursor.execute('SELECT id FROM words WHERE id = ?', (word_id,))
          found_word = cursor.fetchone()
          if not found_word:
              return jsonify({"error": "Word not found"}), 404
          
          # Insert or ignore the group-word relationship
          cursor.execute('''
              INSERT OR IGNORE INTO words_groups (group_id, word_id)
              VALUES (?, ?)
          ''', (group_id, word_id))
          app.db.commit()
          
          # Recalculate words_count in the groups table
          cursor.execute('''
              UPDATE groups
              SET words_count = (
                  SELECT COUNT(*) FROM words_groups WHERE group_id = ?
              )
              WHERE id = ?
          ''', (group_id, group_id))
          app.db.commit()
          
          return jsonify({"success": True}), 200
      except Exception as e:
          return jsonify({"error": str(e)}), 500
      finally:
          app.db.close()
          
  @app.route('/groups', methods=['POST'])
  @cross_origin()
  def create_group():
      try:
          data = request.get_json()
          if not data or 'name' not in data:
              return jsonify({"error": "Invalid input"}), 400
              
          cursor = app.db.cursor()
          cursor.execute(
              'INSERT INTO groups (name) VALUES (?)',
              (data['name'],)
          )
          app.db.commit()
          group_id = cursor.lastrowid
          
          return jsonify({"id": group_id, "name": data['name']}), 201
      except Exception as e:
          return jsonify({"error": str(e)}), 500
      finally:
          app.db.close()