from fastapi import APIRouter, HTTPException
import ollama
import uuid
import os
import json

router = APIRouter()

@router.post("/api/agent")
async def process_lyrics_request(message_request: dict):
    try:
        # Initialize Ollama client
        model_name = "llama3.2:3b"
        
        # Generate a unique handler ID
        handler_id = str(uuid.uuid4())
        
        # Use Ollama SDK to process the request
        response = ollama.chat(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are an assistant that helps find song lyrics."},
                {"role": "user", "content": message_request["message_request"]}
            ]
        )
        
        # Process the response and use tools as needed
        
        return {
            "handler_id": handler_id,
            "lyrics_path": f"/outputs/lyrics/{handler_id}.txt",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
