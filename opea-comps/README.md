# Running Ollama Third-Party Service

## Choosing a Model

You can get the `model_id` that Ollama will launch from the [Ollama Library](https://ollama.com/library).

Example: `LLM_MODEL_ID="llama3.2:1b"`

## Getting the Host IP

### Linux

1. Install net-tools to get your IP address:
    ```sh
    sudo apt install net-tools
    ifconfig
    ```

2. Get your host IP address:
    ```sh
    HOST_IP=$(ifconfig en0 | grep inet | grep -v 127.0.0.1 | awk '{print $2}')
    ```

3. Create a `.env` file with the following content:
    ```sh
    HOST_IP=$(ifconfig en0 | grep inet | grep -v 127.0.0.1 | awk '{print $2}')
    NO_PROXY=localhost
    HTTP_PROXY=
    HTTPS_PROXY=
    LLM_ENDPOINT_PORT=9000
    LLM_MODEL_ID="llama3.2:1b"
    ```

## Running the Ollama Service/Server

1. Start the Ollama service:
    ```sh
    docker-compose up -d
    ```

## Ollama API

Once the Ollama server is running, you can make API calls to the Ollama API. Refer to the [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) for more details.

### Download (Pull) a Model

```sh
curl http://localhost:8008/api/pull -d '{
  "model": "llama3.2:1b"
}'
```

### Generate Request

```sh
curl http://localhost:8008/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Why is the sky blue?"
}'
```

## Technical Uncertainty
Q: Does bridge mode mean we can only access the Ollama API with another model in the Docker Compose?
A: No, the host machine will be able to access it.

Q: Which port is being mapped 8008->141414?
A: In this case, 8008 is the port that the host machine will access. The other port is the guest port (the port of the service inside the container).

Q: If we pass the LLM_MODEL_ID to the Ollama server, will it download the model on start?
A: It does not appear so. The Ollama CLI might be running multiple APIs, so you need to call the /pull API before trying to generate text.

Q: Will the model be downloaded in the container? Does that mean the ML model will be deleted when the container stops running?
A: The model will download into the container and vanish when the container stops running. You need to mount a local drive, and there is probably more work to be done.

Q: For LLM service which can text-generation, it suggests it will only work with TGI/vLLM and all you have to do is have it running. Does TGI and vLLM have a standardized API or is there code to detect which one is running? Do we have to really use Xeon or Gaudi processor?
A: vLLM, TGI (Text Generation Inference), and Ollama all offer APIs with OpenAI compatibility, so in theory, they should be interchangeable.