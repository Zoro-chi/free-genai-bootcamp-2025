from flask import request, jsonify, g
from flask_cors import cross_origin
import json

def load(app):
  # Endpoint: GET /words with pagination (10 words per page)
  @app.route('/words', methods=['GET'])
  @cross_origin()
  def get_words():
    try:
      cursor = app.db.cursor()

      # Get the current page number from query parameters (default is 1)
      page = int(request.args.get('page', 1))
      # Ensure page number is positive
      page = max(1, page)
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

      # Query to fetch words with sorting
      cursor.execute(f'''
        SELECT w.id, w.kanji, w.romaji, w.english, 
            COALESCE(r.correct_count, 0) AS correct_count,
            COALESCE(r.wrong_count, 0) AS wrong_count
        FROM words w
        LEFT JOIN word_reviews r ON w.id = r.word_id
        ORDER BY {sort_by} {order}
        LIMIT ? OFFSET ?
      ''', (words_per_page, offset))

      words = cursor.fetchall()

      # Query the total number of words
      cursor.execute('SELECT COUNT(*) FROM words')
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

      return jsonify({
        "words": words_data,
        "total_pages": total_pages,
        "current_page": page,
        "total_words": total_words
      })

    except Exception as e:
      return jsonify({"error": str(e)}), 500
    finally:
      app.db.close()

  # Endpoint: GET /words/:id to get a single word with its details
  @app.route('/words/<int:word_id>', methods=['GET'])
  @cross_origin()
  def get_word(word_id):
      try:
          cursor = app.db.cursor()
          
          # Query to fetch the word and its details
          cursor.execute('''
              SELECT w.id, w.kanji, w.romaji, w.english,
                  COALESCE(r.correct_count, 0) AS correct_count,
                  COALESCE(r.wrong_count, 0) AS wrong_count,
                  GROUP_CONCAT(DISTINCT g.id || '::' || g.name) as groups
              FROM words w
              LEFT JOIN word_reviews r ON w.id = r.word_id
              LEFT JOIN words_groups wg ON w.id = wg.word_id
              LEFT JOIN groups g ON wg.group_id = g.id
              WHERE w.id = ?
              GROUP BY w.id
          ''', (word_id,))
          
          word = cursor.fetchone()
          
          if not word:
              return jsonify({"error": "Word not found"}), 404
          
          # Parse the groups string into a list of group objects
          groups = []
          if word["groups"]:
              for group_str in word["groups"].split(','):
                  group_id, group_name = group_str.split('::')
                  groups.append({
                      "id": int(group_id),
                      "name": group_name
                  })
          
          return jsonify({
              "word": {
                  "id": word["id"],
                  "kanji": word["kanji"],
                  "romaji": word["romaji"],
                  "english": word["english"],
                  "correct_count": word["correct_count"],
                  "wrong_count": word["wrong_count"],
                  "groups": groups
              }
          })
      except Exception as e:
          return jsonify({"error": str(e)}), 500
      finally:
          app.db.close()
      
  # Endpoint: POST /words to add a new word
  @app.route('/words', methods=['POST'])
  @cross_origin()
  def create_word():
      try:
          data = request.get_json()
          if not data or not all(k in data for k in ('kanji', 'romaji', 'english')):
              return jsonify({"error": "Invalid input"}), 400
          
          parts = data.get('parts', '[]')  # Provide a default empty list if parts is not provided
          
          cursor = app.db.cursor()
          cursor.execute(
              "INSERT INTO words (kanji, romaji, english, parts) VALUES (?, ?, ?, ?)",
              (data['kanji'], data['romaji'], data['english'], parts)
          )
          app.db.commit()
          word_id = cursor.lastrowid
          
          return jsonify({"id": word_id}), 201
      except Exception as e:
          return jsonify({"error": str(e)}), 500
      finally:
          app.db.close()