import requests
import json

# Define the API endpoint
url = "http://localhost:8000/tts"

# Define the payload
payload = {
    "text": "Abraham ti gbọdọ Isaac, Isaac ti gbọdọ Jacob, Jacob ti gbọdọ Judas ati awọn ẹgbon rẹ;",
    "language": "yoruba",
    "speaker_name": "yoruba_male2"
}

# Make the POST request
response = requests.post(url, json=payload)

# Check if the request was successful
if response.status_code == 200:
    # Parse the response JSON
    result = response.json()
    print("Success!")
    print(f"Audio URL: http://localhost:8000{result['audioUrl']}")
    print(f"Cached: {result['cached']}")
    
    # You could also download the audio file
    audio_url = f"http://localhost:8000{result['audioUrl']}"
    audio_response = requests.get(audio_url)
    
    if audio_response.status_code == 200:
        # Save the audio file locally
        filename = result['audioUrl'].split('/')[-1]
        with open(filename, 'wb') as f:
            f.write(audio_response.content)
        print(f"Audio saved to: {filename}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
