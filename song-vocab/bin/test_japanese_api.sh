#!/bin/bash

# Make the script executable with: chmod +x test_japanese_api.sh

# Set the base URL - change port if your app uses a different one
BASE_URL="http://localhost:8000"

echo "Testing Japanese song vocabulary analysis..."

# Step 1: Use the agent endpoint to retrieve lyrics
echo -e "\n===== Step 1: Retrieving Japanese Song Lyrics ====="
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "message_request": "Find lyrics for the song Sakura by Naotaro Moriyama in Japanese"
  }')

# Extract handler_id from response
HANDLER_ID=$(echo $RESPONSE | grep -o '"handler_id":"[^"]*"' | cut -d':' -f2 | tr -d '"' | tr -d ',')
LYRICS_PATH=$(echo $RESPONSE | grep -o '"lyrics_path":"[^"]*"' | cut -d':' -f2 | tr -d '"' | tr -d ',')

echo "Retrieved handler_id: $HANDLER_ID"
echo "Lyrics stored at: $LYRICS_PATH"

# Step 2: Process vocabulary from the retrieved lyrics
echo -e "\n===== Step 2: Processing Japanese Vocabulary ====="
curl -X POST "${BASE_URL}/api/get_vocabulary" \
  -H "Content-Type: application/json" \
  -d '{
    "handler_id": "'$HANDLER_ID'"
  }'

echo -e "\n\nJapanese lyrics analysis completed!"
