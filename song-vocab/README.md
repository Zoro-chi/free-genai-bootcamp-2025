# Song Vocabulary App

A tool for analyzing vocabulary from song lyrics in multiple languages. The app helps language learners by extracting vocabulary from songs and providing language learning resources.

## Features

- Search for song lyrics using natural language queries
- Extract vocabulary from lyrics in multiple languages
- Process English and Japanese lyrics with specialized handling
- Save lyrics for future reference
- Vocabulary extraction with frequency analysis
- Part-of-speech identification (where available)

## Prerequisites

- Python 3.7+
- Internet connection (for web search functionality)
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd song-vocab
   ```

2. Set up a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with any custom configuration if needed.

## Running the Application

Start the server:
```bash
python app.py
```

By default, the server runs on `http://localhost:8000`. You can access the API endpoints through this URL.

## API Documentation

### Endpoints

#### 1. Retrieve Song Lyrics

This endpoint allows you to search for lyrics using natural language queries.

```
POST /api/agent
```

Request body:
```json
{
  "message_request": "Find lyrics for the song [SONG NAME] by [ARTIST]"
}
```

Example:
```json
{
  "message_request": "Find lyrics for the song Hey Brother by Avicii"
}
```

Response:
```json
{
  "lyrics": "Hey brother...",
  "vocabulary": [
    {"word": "brother", "count": 4, "part_of_speech": "noun", "meaning": ""},
    // More words...
  ],
  "handler_id": "unique-handler-id",
  "lyrics_path": "path/to/stored/lyrics.txt"
}
```

#### 2. Retrieve Vocabulary from Previously Processed Lyrics

```
POST /api/get_vocabulary
```

Request body:
```json
{
  "handler_id": "unique-handler-id"
}
```

Response:
```json
{
  "vocabulary": [
    {"word": "brother", "count": 4, "part_of_speech": "noun", "meaning": ""},
    // More words...
  ]
}
```

## Usage Examples

### Using the CLI Tool

We provide a bash script for testing the Japanese lyrics functionality:

```bash
cd bin
chmod +x test_japanese_api.sh
./test_japanese_api.sh
```

### Manual API Calls

1. Retrieve lyrics and vocabulary:
```bash
curl -X POST "http://localhost:8000/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "message_request": "Find lyrics for the song Emotionally Scarred by Lil Baby"
  }'
```

2. Process vocabulary using a handler ID:
```bash
curl -X POST "http://localhost:8000/api/get_vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "handler_id": "your-handler-id-from-previous-response"
  }'
```

## Supported Languages

- English (full support)
- Japanese (with fugashi and ipadic)
- Other languages (basic support)

## Lyrics Sources

The application searches for lyrics across various online sources including:
- Genius.com
- AZLyrics
- Lyrics.com
- SongLyrics
- And many other lyrics websites

## Technical Details

- Uses FastAPI for the web server
- DuckDuckGo Search for finding lyrics sources
- NLTK for English language processing
- Fugashi for Japanese tokenization (when available)
- BeautifulSoup for HTML parsing
- Regular expressions for lyrics cleaning and extraction

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.