## Business Requirements

Build a learning portal that allows users to learn a new language. The portal should have the following features:

- Have an inventory of words in the language the user is learning
- Have a group of words to a thematic category (e.g. animals, colors, etc.)
- Store the user's study sessions (e.g. words studied, time spent, words right and words wrong etc.)

## Technical Requirements

- The backend should be built using Flask
- The backend should have a RESTful API
- The database should be SQLite3
- The API will always return JSON
- There will be no authentication or authorization required
- Everything will be treated as a single user

### Database Schema

We will have the following tables:

- `words`:
  Store words in the language the user is learning

  - `id`: Integer, Primary Key
  - `kanji`: String
  - `romanji`: String
  - `english`: String
  - `group_id`: Integer, Foreign Key to `groups.id`

- `words_groups`:
  Join table between `words` and `groups` table many-to-many relationship

  - `id`: Integer, Primary Key
  - `word_id`: Integer, Foreign Key to `words.id`
  - `group_id`: Integer, Foreign Key to `groups.id`

- `groups`:
  Store thematic group of words

  - `id`: Integer, Primary Key
  - `name`: String

- `study_sessions`:
  Record of study sessions grouping word_review_items

  - `id`: Integer, Primary Key
  - `group_id`: Integer,
  - `study_activity_id`: Integer
  - `created_at`: DateTime

- `study_activities`:
  A specific study activity linking, a study session to group

  - `id`: Integer, Primary Key
  - `study_session_id`: Integer
  - `group_id`: Integer
  - `created_at`: DateTime

- `word_review_items`:
  A specific word review item linking, a study session to group

- `id`: Integer, Primary Key
- `user_id`: Integer, Foreign Key to `users.id`
- `word_id`: Integer, Foreign Key to `words.id`
- `correct`: Boolean
- `time_spent`: Integer
- `next_review_date`: Date
- `review_count`: Integer
- `review_interval`: Integer

### API Endpoints

#### `GET /api/words`:

- Returns a list of 100 words
- Pagination is supported
- The Response JSON should look like this:

```json
{
	"words": [
		{
			"id": 1,
			"kanji": "犬",
			"romanji": "inu",
			"english": "dog",
			"group_id": 1
		},
		{
			"id": 2,
			"kanji": "猫",
			"romanji": "neko",
			"english": "cat",
			"group_id": 1
		}
	]
}
```

#### `GET /api/words/:id`:

- Returns a word by id
- The Response JSON should look like this:

```json
{
	"id": 1,
	"kanji": "犬",
	"romanji": "inu",
	"english": "dog",
	"group_id": 1
}
```

#### `GET /api/groups`:

- Returns a list of groups
- The Response JSON should look like this:

```json
{
	"groups": [
		{
			"id": 1,
			"name": "Animals"
		},
		{
			"id": 2,
			"name": "Colors"
		}
	]
}
```

#### `GET /api/groups/:id`:

- Returns a group by id
- The Response JSON should look like this:

```json
{
	"id": 1,
	"name": "Animals"
}
```

#### `POST /api/study-sessions`:

- Create a new study session
- The request JSON should look like this:

```json
{
	"user_id": 1,
	"word_id": 1,
	"correct": true,
	"time_spent": 10
}
```

#### `GET /api/study-sessions`:

- Returns a list of study sessions
- The Response JSON should look like this:

```json
{
	"study_sessions": [
		{
			"id": 1,
			"user_id": 1,
			"word_id": 1,
			"correct": true,
			"time_spent": 10
		},
		{
			"id": 2,
			"user_id": 1,
			"word_id": 2,
			"correct": false,
			"time_spent": 20
		}
	]
}
```
