from flask import jsonify, request
from flask_cors import cross_origin

def load(app):
    @app.route('/dashboard/recent-session', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_recent_session():
        if request.method == 'OPTIONS':
            return '', 200
            
        try:
            cursor = app.db.cursor()
            
            # Get the most recent study session with activity name and results
            cursor.execute('''
                SELECT 
                    ss.id,
                    ss.group_id,
                    sa.name as activity_name,
                    ss.created_at,
                    COUNT(CASE WHEN wri.correct = 1 THEN 1 END) as correct_count,
                    COUNT(CASE WHEN wri.correct = 0 THEN 1 END) as wrong_count
                FROM study_sessions ss
                JOIN study_activities sa ON ss.study_activity_id = sa.id
                LEFT JOIN word_review_items wri ON ss.id = wri.study_session_id
                GROUP BY ss.id
                ORDER BY ss.created_at DESC
                LIMIT 1
            ''')
            
            session = cursor.fetchone()
            
            if not session:
                return jsonify(None)
            
            return jsonify({
                "id": session["id"],
                "group_id": session["group_id"],
                "activity_name": session["activity_name"],
                "created_at": session["created_at"],
                "correct_count": session["correct_count"] or 0,
                "wrong_count": session["wrong_count"] or 0
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    @app.route('/dashboard/stats', methods=['GET', 'OPTIONS'])
    @cross_origin()
    def get_study_stats():
        if request.method == 'OPTIONS':
            return '', 200
            
        try:
            cursor = app.db.cursor()
            
            # Get vocabulary count
            cursor.execute('SELECT COUNT(*) as count FROM words')
            total_vocabulary = cursor.fetchone()['count']
            
            # Get group count
            cursor.execute('SELECT COUNT(*) as count FROM groups')
            total_groups = cursor.fetchone()['count']
            
            # Get study sessions count
            cursor.execute('SELECT COUNT(*) as count FROM study_sessions')
            total_sessions = cursor.fetchone()['count']
            
            # Get word reviews
            cursor.execute('''
                SELECT SUM(correct_count) as correct, SUM(wrong_count) as wrong
                FROM word_reviews
            ''')
            reviews = cursor.fetchone()
            
            # Calculate success rate
            correct_count = reviews['correct'] or 0
            wrong_count = reviews['wrong'] or 0
            total_reviews = correct_count + wrong_count
            success_rate = round((correct_count / total_reviews * 100) if total_reviews > 0 else 0, 1)
            
            return jsonify({
                "total_vocabulary": total_vocabulary,
                "total_groups": total_groups,
                "total_sessions": total_sessions,
                "correct_reviews": correct_count,
                "wrong_reviews": wrong_count,
                "success_rate": success_rate
            })
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500