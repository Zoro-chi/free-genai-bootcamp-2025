"""
FastAPI application for the Song Vocabulary Analyzer.
"""
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
from agent import SongAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("app")

app = FastAPI(title="Song Vocabulary Analyzer")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent
song_agent = SongAgent()

class MessageRequest(BaseModel):
    message_request: str

class HandlerIdRequest(BaseModel):
    handler_id: str

class LyricsResponse(BaseModel):
    lyrics: str
    vocabulary: List[Dict[str, Any]]
    handler_id: str
    lyrics_path: str
    song_title: Optional[str] = None
    artist: Optional[str] = None
    song_id: Optional[str] = None
    romaji_lyrics: Optional[str] = ""
    romaji_path: Optional[str] = ""

class VocabularyResponse(BaseModel):
    vocabulary: List[Dict[str, Any]]

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses."""
    logger.info(f"Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(e)}"}
        )

@app.post("/api/agent", response_model=LyricsResponse)
async def process_agent_request(request: MessageRequest):
    """
    Get song lyrics from the web using the agent.
    
    This endpoint processes the request to:
    1. Search for the song lyrics
    2. Extract the lyrics content
    3. Generate a vocabulary list from the lyrics
    """
    try:
        logger.info(f"Processing lyrics request: {request.message_request}")
        
        # Import and ensure NLTK resources are available
        import nltk
        nltk_resources = ['punkt', 'stopwords']
        for resource in nltk_resources:
            try:
                nltk.data.find(f'tokenizers/{resource}')
            except LookupError:
                logger.info(f"Downloading NLTK resource: {resource}")
                nltk.download(resource)
        
        result = await song_agent.process_lyrics_request(request.message_request)
        
        # Correctly access dictionary keys with bracket notation
        response = {
            "lyrics": result["lyrics"],
            "vocabulary": result["vocabulary"],
            "lyrics_path": result["lyrics_path"],
            "handler_id": result["handler_id"]  # Placed at the end of the response
        }
        
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/api/get_vocabulary", response_model=VocabularyResponse)
async def get_vocabulary(request: HandlerIdRequest):
    """
    Extract vocabulary from previously retrieved lyrics using a handler ID.
    """
    try:
        if request.handler_id not in song_agent.handlers:
            raise HTTPException(status_code=404, detail="Handler ID not found")
            
        return {"vocabulary": song_agent.handlers[request.handler_id]["vocabulary"]}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error extracting vocabulary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting vocabulary: {str(e)}")

@app.get("/")
async def root():
    return {"status": "API is running", "endpoints": ["/api/agent", "/api/get_vocabulary"]}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
