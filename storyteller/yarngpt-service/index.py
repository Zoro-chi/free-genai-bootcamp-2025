from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time
import torch
import torchaudio
import uvicorn
from transformers import AutoModelForCausalLM
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Add patch for PyTorch 2.6+ weights_only issue
# This is necessary because PyTorch 2.6 changed default behavior of torch.load
original_torch_load = torch.load
def patched_torch_load(*args, **kwargs):
    # Force weights_only=False to maintain compatibility with older models
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return original_torch_load(*args, **kwargs)
torch.load = patched_torch_load

# Import YarnGPT2 or install if needed
try:
    from yarngpt.audiotokenizer import AudioTokenizerV2
except ImportError:
    os.system("pip install outetts uroman")
    os.system("git clone https://github.com/saheedniyi02/yarngpt.git")
    os.system("pip install -e yarngpt")
    from yarngpt.audiotokenizer import AudioTokenizerV2

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define model paths
tokenizer_path = "saheedniyi/YarnGPT2"
wav_tokenizer_config = "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
wav_tokenizer_model = "wavtokenizer_large_speech_320_24k.ckpt"

# Download models if they don't exist
if not os.path.exists(wav_tokenizer_config) or not os.path.exists(wav_tokenizer_model):
    print("Downloading model files...")
    # Download YAML config using curl
    os.system("curl -L 'https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml' -o wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml")
    
    # Download the model file using gdown
    print("Downloading model file using gdown...")
    os.system("gdown 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt")
    
    # Verify the file is now a valid PyTorch model
    if os.path.exists(wav_tokenizer_model):
        filesize = os.path.getsize(wav_tokenizer_model)
        print(f"Downloaded model file size: {filesize} bytes")
        
        if filesize < 1000000:  # Less than 1MB is suspicious for a model file
            print("WARNING: Model file seems too small, might not be valid")
            # Let's check what's in the file
            os.system(f"head -c 100 {wav_tokenizer_model} | hexdump -C")
    else:
        print("ERROR: Failed to download model file")

# Ensure output directory exists
os.makedirs("audio_cache", exist_ok=True)

# Define request model
class TTSRequest(BaseModel):
    text: str
    language: str = "english"
    speaker_name: str = "idera"
    filename: str = None

# Initialize models (lazy loading)
audio_tokenizer = None
model = None

# Modify load_models to add better error handling
def load_models():
    global audio_tokenizer, model
    if audio_tokenizer is None:
        print("Loading YarnGPT2 models...")
        try:
            # Check if the model file exists and has reasonable size
            if not os.path.exists(wav_tokenizer_model):
                raise FileNotFoundError(f"Model file {wav_tokenizer_model} not found")
                
            filesize = os.path.getsize(wav_tokenizer_model)
            if filesize < 1000000:  # Less than 1MB is suspicious for a model file
                print(f"WARNING: Model file size ({filesize} bytes) seems too small")
                
            print(f"Initializing AudioTokenizerV2 with model: {wav_tokenizer_model} ({filesize} bytes)")
            audio_tokenizer = AudioTokenizerV2(
                tokenizer_path, 
                wav_tokenizer_model, 
                wav_tokenizer_config
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                tokenizer_path, 
                torch_dtype="auto"
            ).to(audio_tokenizer.device)
            print("Models loaded successfully!")
        except Exception as e:
            print(f"ERROR loading models: {str(e)}")
            # Add debug info about the model file
            if os.path.exists(wav_tokenizer_model):
                os.system(f"file {wav_tokenizer_model}")
                os.system(f"head -c 50 {wav_tokenizer_model} | hexdump -C")
            raise e

@app.get("/")
def read_root():
    return {"status": "YarnGPT2 TTS service is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/tts")
async def generate_tts(request: TTSRequest):
    # Load models if not already loaded
    load_models()
    
    try:
        # Generate a filename if not provided
        if not request.filename:
            timestamp = int(time.time())
            filename = f"{timestamp}_{request.language}_{request.speaker_name}.wav"
        else:
            filename = request.filename
            
        output_path = os.path.join("audio_cache", filename)
        
        # Check if file already exists in cache
        if os.path.exists(output_path):
            return {"audioUrl": f"/audio/{filename}", "cached": True}
        
        # Preprocess text: replace semicolons with commas to help with parsing
        processed_text = request.text.replace(';', ',')
        
        # If text is long, check if we need to split it
        max_text_length = 200  # Characters - adjust based on testing
        if len(processed_text) > max_text_length:
            print(f"Warning: Text is long ({len(processed_text)} chars), might be truncated")
        
        # Create prompt for YarnGPT2
        prompt = audio_tokenizer.create_prompt(
            text=processed_text,
            lang=request.language,
            speaker_name=request.speaker_name
        )
        
        # Tokenize prompt
        input_ids = audio_tokenizer.tokenize_prompt(prompt)
        
        # Create attention mask (all 1s since we don't have padding)
        attention_mask = torch.ones(input_ids.shape, dtype=torch.long, device=input_ids.device)
        
        # Get tokenizer info for proper configuration
        if hasattr(audio_tokenizer, 'tokenizer'):
            tokenizer = audio_tokenizer.tokenizer
            pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 0
            eos_token_id = tokenizer.eos_token_id if tokenizer.eos_token_id is not None else 0
            # Ensure pad_token_id is different from eos_token_id
            if pad_token_id == eos_token_id:
                pad_token_id = tokenizer.eos_token_id + 1
        else:
            # Default values if tokenizer isn't directly accessible
            pad_token_id = 1  # Different from default eos_token_id (0)
            eos_token_id = 0
        
        # Generate output with explicit parameters to avoid warnings
        # Enable sampling to use temperature properly
        output = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            pad_token_id=pad_token_id,
            eos_token_id=eos_token_id,
            do_sample=True,  # Enable sampling to use temperature
            temperature=0.1,
            repetition_penalty=1.1,
            max_length=4000,
            # Add parameters to improve reliability
            top_k=50,
            top_p=0.95,
            no_repeat_ngram_size=2
        )
        
        # Log token lengths to help diagnose truncation
        print(f"Input tokens: {input_ids.shape[1]}, Output tokens: {output.shape[1]}")
        
        # Convert to audio
        codes = audio_tokenizer.get_codes(output)
        audio = audio_tokenizer.get_audio(codes)
        
        # Save audio file
        torchaudio.save(output_path, audio, sample_rate=24000)
        
        # Return success response with info about text length
        return {
            "audioUrl": f"/audio/{filename}", 
            "cached": False,
            "textLength": len(request.text),
            "processedTextLength": len(processed_text),
            "inputTokens": input_ids.shape[1],
            "outputTokens": output.shape[1]
        }
    
    except Exception as e:
        print(f"Error in TTS generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    audio_path = os.path.join("audio_cache", filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(audio_path, media_type="audio/wav")

if __name__ == "__main__":
    uvicorn.run("index:app", host="0.0.0.0", port=8000, reload=True)