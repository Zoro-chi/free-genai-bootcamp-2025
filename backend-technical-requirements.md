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

The database will be a single sqlite database called `words.db`
This will be in the root of the backend folder.

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

#### GET `/api/dashboard/last_study_session`

Returns information about the most recent study session.

```json
{
	"id": 123,
	"group_id": 456,
	"created_at": "2025-02-08T17:20:23-05:00",
	"study_activity_id": 789,
	"group_id": 456,
	"group_name": "Basic Greetings"
}
```

#### GET `/api/dashboard/study_progress`

Returns study progress statistics.
Please note that the frontend will determine progress bar basedon total words studied and total available words.


```json
{
	"total_words_studied": 3,
	"total_available_words": 124
}
```

#### GET `/api/dashboard/quick-stats`

Returns quick overview statistics.

```json
{
	"success_rate": 80.0,
	"total_study_sessions": 4,
	"total_active_groups": 3,
	"study_streak_days": 4
}
```

#### GET `/api/study_activities/:id`

```json
{
	"id": 1,
	"name": "Vocabulary Quiz",
	"thumbnail_url": "https://example.com/thumbnail.jpg",
	"description": "Practice your vocabulary with flashcards"
}
```

#### GET `/api/study_activities/:id/study_sessions`
- pagination with 100 items per page

```json
{
	"items": [
		{
			"id": 123,
			"activity_name": "Vocabulary Quiz",
			"group_name": "Basic Greetings",
			"start_time": "2025-02-08T17:20:23-05:00",
			"end_time": "2025-02-08T17:30:23-05:00",
			"review_items_count": 20
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 5,
		"total_items": 100,
		"items_per_page": 20
	}
}
```

#### POST `/api/study_activities`

##### Request Params

- group_id integer
- study_activity_id integer

```json
{
"id": 124,
"group_id": 123
}
```

#### GET `/api/words`

- pagination with 100 items per page

```json
{
	"items": [
		{
			"japanese": "こんにちは",
			"romaji": "konnichiwa",
			"english": "hello",
			"correct_count": 5,
			"wrong_count": 2
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 5,
		"total_items": 500,
		"items_per_page": 100
	}
}
```

#### GET `/api/words/:id`


```json
{
	"japanese": "こんにちは",
	"romaji": "konnichiwa",
	"english": "hello",
	"stats": {
		"correct_count": 5,
		"wrong_count": 2
	},
	"groups": [
		{
			"id": 1,
			"name": "Basic Greetings"
		}
	]
}
```

#### GET `/api/groups`

- pagination with 100 items per page


```json
{
	"items": [
		{
			"id": 1,
			"name": "Basic Greetings",
			"word_count": 20
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 10,
		"items_per_page": 100
	}
}
```

#### GET `/api/groups/:id`


```json
{
	"id": 1,
	"name": "Basic Greetings",
	"stats": {
		"total_word_count": 20
	}
}
```

#### GET `/api/groups/:id/words`

```json
{
	"items": [
		{
			"japanese": "こんにちは",
			"romaji": "konnichiwa",
			"english": "hello",
			"correct_count": 5,
			"wrong_count": 2
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 20,
		"items_per_page": 100
	}
}
```

#### GET `/api/groups/:id/study_sessions`

```json
{
	"items": [
		{
			"id": 123,
			"activity_name": "Vocabulary Quiz",
			"group_name": "Basic Greetings",
			"start_time": "2025-02-08T17:20:23-05:00",
			"end_time": "2025-02-08T17:30:23-05:00",
			"review_items_count": 20
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 5,
		"items_per_page": 100
	}
}
```

#### GET `/api/study_sessions`

- pagination with 100 items per page


```json
{
	"items": [
		{
			"id": 123,
			"activity_name": "Vocabulary Quiz",
			"group_name": "Basic Greetings",
			"start_time": "2025-02-08T17:20:23-05:00",
			"end_time": "2025-02-08T17:30:23-05:00",
			"review_items_count": 20
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 5,
		"total_items": 100,
		"items_per_page": 100
	}
}
```

#### GET `/api/study_sessions/:id`

```json
{
	"id": 123,
	"activity_name": "Vocabulary Quiz",
	"group_name": "Basic Greetings",
	"start_time": "2025-02-08T17:20:23-05:00",
	"end_time": "2025-02-08T17:30:23-05:00",
	"review_items_count": 20
}
```

#### GET `/api/study_sessions/:id/words`

- pagination with 100 items per page

```json
{
	"items": [
		{
			"japanese": "こんにちは",
			"romaji": "konnichiwa",
			"english": "hello",
			"correct_count": 5,
			"wrong_count": 2
		}
	],
	"pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 20,
		"items_per_page": 100
	}
}
```

#### POST `/api/reset_history`

```json
{
	"success": true,
	"message": "Study history has been reset"
}
```

#### POST `/api/full_reset`

```json
{
	"success": true,
	"message": "System has been fully reset"
}
```

#### POST `/api/study_sessions/:id/words/:word_id/review`

##### Request Params

- id (study_session_id) integer
- word_id integer
- correct boolean

##### Request Payload

```json
{
	"correct": true
}
```

```json
{
	"success": true,
	"word_id": 1,
	"study_session_id": 123,
	"correct": true,
	"created_at": "2025-02-08T17:33:07-05:00"
}
```

## Tasks

Lets list out the possible tasks needed for this project:

### Initialize Database
This task will initialize the database called `words.db` with the schema mentioned above.

### Migrate Database
This task will run a series of migrations sql files on the database.
Migrations will be in the `migrations` folder.
The migration files will be run in order of their filenames.
The filenames should look like this:
```sql
0001_init.sql
0002_create_words_table.sql
```

### Seed Data
This task will import json files and transform them into target data for the database.
All seed files are in the `seed` folder.
All seed files should be loaded.
In our task we should have DSL to specify each seed file and its expected group word name.


```json
[
  {
    "kanji": "いい",
    "romaji": "ii",
    "english": "good",
  },
  ...
]
```