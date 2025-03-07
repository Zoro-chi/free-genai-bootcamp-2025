# Tech Specs
## Business Goals

## Technical Requirements
- Python 3.10
- FastAPI
- Ollama (ollama via python sdk) 
    - llama 3.2:3b model
- SQLite3
- Instructor (For structured JSON output)
- duckduckgo-search (to search for lyrics)

## Storage Structure
- `/outputs/lyrics/`: Directory to store downloaded lyrics as text files
- `/outputs/vocabulary/`: Directory to store processed vocabulary as JSON files

## Exposed Endpoints

### Get Lyrics 
- `/api/agent`: This endpoint takes a song title and artist name as input and retrieves the lyrics, saves them to a file, and returns a handler to access the saved data.

- **Behavior**
This endpoint uses the reAct framework agent to search the web and find lyrics. It stores the raw lyrics in the outputs directory and generates a unique handler for later access.

Tools available:
- tools/extract_vocabulary.py
- tools/get_page_content.py
- tools/serach_web.py

- **JSON Request Params**
    - `message_request` (str): A string that describes the song and/or artist to get lyrics for a song from the web. 
- **JSON Response**
    - `handler_id` (str): A unique identifier for accessing the stored lyrics and vocabulary data
    - `lyrics_path` (str): Path to the stored lyrics file
    - `status` (str): Success or error status of the operation

### Get Vocabulary
- `/api/get_vocabulary`: This endpoint takes a handler ID, loads the corresponding lyrics file, processes the vocabulary, and returns a reference to the processed vocabulary data.

- **JSON Request Params**
    - `handler_id` (str): The unique identifier returned by the agent endpoint
- **JSON Response**
    - `handler_id` (str): The same unique identifier
    - `vocabulary_path` (str): Path to the JSON file containing the processed vocabulary
    - `word_count` (int): Number of vocabulary words identified

