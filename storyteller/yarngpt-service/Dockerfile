FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clone YarnGPT repo
RUN git clone https://github.com/saheedniyi02/yarngpt.git
RUN pip install -e ./yarngpt

# Download model files
RUN wget https://huggingface.co/novateur/WavTokenizer-medium-speech-75token/resolve/main/wavtokenizer_mediumdata_frame75_3s_nq1_code4096_dim512_kmeans200_attn.yaml
RUN pip install gdown
RUN gdown 1-ASeEkrn4HY49yZWHTASgfGFNXdVnLTt

# Create cache directory
RUN mkdir -p /app/audio_cache

# Copy application code
COPY index.py .

# Expose port
EXPOSE 8000

# Run app
CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000"]