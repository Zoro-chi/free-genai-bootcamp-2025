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
wav_tokenizer_config_path = "wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml"
wav_tokenizer_model_path = "wavtokenizer_large_speech_320_24k.ckpt"

# Download models if they don't exist
if not os.path.exists(wav_tokenizer_config_path) or not os.path.exists(wav_tokenizer_model_path):
    print("Downloading model files...")
    # Download YAML config using curl
    os.system("curl -L 'https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml' -o wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml")
    
    # Download the model file using gdown
    print("Downloading model file using gdown...")
    os.system("gdown 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt")
    
    # Verify the file is now a valid PyTorch model
    if os.path.exists(wav_tokenizer_model_path):
        filesize = os.path.getsize(wav_tokenizer_model_path)
        print(f"Downloaded model file size: {filesize} bytes")
        
        if filesize < 1000000:  # Less than 1MB is suspicious for a model file
            print("WARNING: Model file seems too small, might not be valid")
            # Let's check what's in the file
            os.system(f"head -c 100 {wav_tokenizer_model_path} | hexdump -C")
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
            if not os.path.exists(wav_tokenizer_model_path):
                raise FileNotFoundError(f"Model file {wav_tokenizer_model_path} not found")
                
            filesize = os.path.getsize(wav_tokenizer_model_path)
            if filesize < 1000000:  # Less than 1MB is suspicious for a model file
                print(f"WARNING: Model file size ({filesize} bytes) seems too small")
                
            print(f"Initializing AudioTokenizerV2 with model: {wav_tokenizer_model_path} ({filesize} bytes)")
            # Match the exact order in documentation: tokenizer_path, model_path, config_path
            audio_tokenizer = AudioTokenizerV2(
                tokenizer_path, 
                wav_tokenizer_model_path, 
                wav_tokenizer_config_path
            )
            
            model = AutoModelForCausalLM.from_pretrained(
                tokenizer_path, 
                torch_dtype="auto"
            ).to(audio_tokenizer.device)
            print("Models loaded successfully!")
        except Exception as e:
            print(f"ERROR loading models: {str(e)}")
            # Add debug info about the model file
            if os.path.exists(wav_tokenizer_model_path):
                os.system(f"file {wav_tokenizer_model_path}")
                os.system(f"head -c 50 {wav_tokenizer_model_path} | hexdump -C")
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
        
        # Store the original text
        original_text = request.text
        
        # IMPORTANT: Don't modify the input text anymore - just pass it directly
        processed_text = request.text
        
        # Debug print the exact text being used
        print(f"Original text: '{original_text}'")
        print(f"Text used for TTS: '{processed_text}'")
        
        # Check if text exceeds token limit - but don't truncate automatically
        if len(processed_text) > 500:  # increased from 200
            print(f"Warning: Text is very long ({len(processed_text)} chars), might cause generation issues")
        
        # Create prompt for YarnGPT2 - follow documentation exactly
        prompt = audio_tokenizer.create_prompt(
            text=processed_text,
            lang=request.language,
            speaker_name=request.speaker_name
        )
        
        # Tokenize prompt - keep it simple like in the docs
        input_ids = audio_tokenizer.tokenize_prompt(prompt)
        
        # Generate output following the documentation exactly
        output = model.generate(
            input_ids=input_ids,
            temperature=0.1,
            repetition_penalty=1.1,
            max_length=4000,
        )
        
        # Log token lengths
        print(f"Input tokens: {input_ids.shape[1]}, Output tokens: {output.shape[1]}")
        
        # Follow documentation example exactly for audio generation
        print("Generating audio codes...")
        codes = audio_tokenizer.get_codes(output)
        
        print("Generating audio from codes...")
        audio = audio_tokenizer.get_audio(codes)
        
        # Simple validation without modifying the tensor
        print(f"Audio shape: {audio.shape}, duration: {audio.shape[1]/24000:.2f}s")
        
        # Add 1 second of silence padding at beginning and end
        sample_rate = 24000
        silence_samples = sample_rate  # 1 second of silence
        
        # Create silence tensors (1-channel audio with zeros)
        silence = torch.zeros(1, silence_samples, device=audio.device, dtype=audio.dtype)
        
        # Add padding to beginning and end
        padded_audio = torch.cat([silence, audio, silence], dim=1)
        
        print(f"Padded audio shape: {padded_audio.shape}, duration: {padded_audio.shape[1]/sample_rate:.2f}s")
        
        # Save audio file with padding
        print(f"Saving padded audio to {output_path}")
        torchaudio.save(output_path, padded_audio, sample_rate=sample_rate)
        
        # Calculate durations for the response
        original_duration = audio.shape[1] / sample_rate
        padded_duration = padded_audio.shape[1] / sample_rate
        
        # Return success response
        return {
            "audioUrl": f"/audio/{filename}", 
            "cached": False,
            "textLength": len(request.text),
            "audioDuration": f"{padded_duration:.2f}s",
            "originalDuration": f"{original_duration:.2f}s",
            "paddingAdded": "1 second before and after"
        }
    
    except Exception as e:
        print(f"Error in TTS generation: {str(e)}")
        print(f"Exception type: {type(e).__name__}")
        print(f"Request text: '{request.text}'")
        print(f"Request language: {request.language}")
        print(f"Request speaker: {request.speaker_name}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    audio_path = os.path.join("audio_cache", filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(audio_path, media_type="audio/wav")

if __name__ == "__main__":
    uvicorn.run("index:app", host="0.0.0.0", port=8000, reload=True)