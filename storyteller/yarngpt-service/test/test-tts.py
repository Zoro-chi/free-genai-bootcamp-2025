import requests
import json
import sys
import os
import argparse

# Define the API endpoint
url = "http://localhost:8000/tts"

# Define some test payloads for different scenarios
test_payloads = {
    "english_short": {
        "text": "This is a short test of the YarnGPT text to speech service.",
        "language": "english",
        "speaker_name": "idera"
    },
    "english_medium": {
        "text": "This is a longer test of the YarnGPT text to speech service. It contains multiple sentences to verify that longer content is processed correctly and not truncated in the middle of the speech generation.",
        "language": "english",
        "speaker_name": "idera"
    },
    "yoruba": {
        "text": "Habeeb Okikiọla Olalomi Badmus ti ọpọ awọn ololufẹ rẹ mọ si Portable ti sọ fun ile ẹjọ majisireeti ti ipinlẹ Ogun wi pe ṣaka lara oun da, oun ko ni aisan tabi arun kankan lara.",
        "language": "yoruba",
        "speaker_name": "yoruba_male2"
    },
    "custom": None  # Will be filled with user input if custom mode is selected
}

def main():
    parser = argparse.ArgumentParser(description='Test YarnGPT TTS Service')
    parser.add_argument('--test', choices=list(test_payloads.keys()) + ['all'], 
                        default='english_short', help='Test case to run')
    parser.add_argument('--text', type=str, help='Custom text to synthesize')
    parser.add_argument('--lang', type=str, default='english', 
                        choices=['english', 'yoruba', 'igbo', 'pidgin'], 
                        help='Language for custom text')
    parser.add_argument('--speaker', type=str, default='idera', 
                        help='Speaker voice to use')
    
    args = parser.parse_args()
    
    # Handle custom text input
    if args.text:
        test_payloads["custom"] = {
            "text": args.text,
            "language": args.lang,
            "speaker_name": args.speaker
        }
        args.test = "custom"
    
    # Determine which tests to run
    test_cases = list(test_payloads.keys()) if args.test == 'all' else [args.test]
    
    # Run the selected tests
    for test_name in test_cases:
        if test_name not in test_payloads or test_payloads[test_name] is None:
            continue
            
        payload = test_payloads[test_name]
        
        print(f"\n{'=' * 50}")
        print(f"RUNNING TEST: {test_name}")
        print(f"{'=' * 50}")
        
        print("Testing YarnGPT TTS Service...")
        print(f"URL: {url}")
        print(f"Text: '{payload['text']}'")
        print(f"Language: {payload['language']}")
        print(f"Speaker: {payload['speaker_name']}")
        
        try:
            # Make the POST request
            print("\nSending request...")
            response = requests.post(url, json=payload, timeout=300)  # Longer timeout
            
            # Check if the request was successful
            print(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                # Parse the response JSON
                result = response.json()
                print("\nSuccess!")
                print(f"Audio URL: http://localhost:8000{result['audioUrl']}")
                print(f"Cached: {result.get('cached', 'Not specified')}")
                
                # Additional diagnostic info if available
                if 'textLength' in result:
                    print(f"Text length: {result['textLength']} characters")
                    print(f"Input text: '{payload['text']}'")
                    print(f"Processed text length: {result.get('processedTextLength', 'N/A')} characters")
                if 'inputTokens' in result:
                    print(f"Input tokens: {result['inputTokens']}")
                if 'outputTokens' in result:
                    print(f"Output tokens: {result['outputTokens']}")
                
                # Ask if user wants to download the audio file
                should_download = input("\nDownload the audio file? (y/n): ")
                if should_download.lower() in ['y', 'yes']:
                    audio_url = f"http://localhost:8000{result['audioUrl']}"
                    audio_response = requests.get(audio_url)
                    
                    if audio_response.status_code == 200:
                        # Generate a unique filename including test case name
                        filename = f"{test_name}_{result['audioUrl'].split('/')[-1]}"
                        with open(filename, 'wb') as f:
                            f.write(audio_response.content)
                        print(f"Audio saved to: {filename}")
                    else:
                        print(f"Error downloading audio: {audio_response.status_code}")
                        print(audio_response.text)
            else:
                print("\nError Response:")
                print(f"Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(json.dumps(error_data, indent=2))
                except:
                    print(response.text)
        except Exception as e:
            print(f"\nException occurred: {e}")
            print(f"Type: {type(e).__name__}")

if __name__ == "__main__":
    main()
