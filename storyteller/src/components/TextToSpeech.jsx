'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { HiSpeakerphone, HiStop, HiRefresh } from 'react-icons/hi';

const TextToSpeech = ({ text, language = 'english', className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [availableVoices, setAvailableVoices] = useState({});
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  // Mock TTS function since Python service might not be set up yet
  const mockTTS = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      
      // For testing, alert the text that would be spoken
      alert(`Would speak in ${language} with voice ${selectedVoice}: "${text.substring(0, 50)}..."`);
      
      // In real implementation, we would set the audioUrl here
      setAudioUrl(null);
    }, 1000);
  };
  
  // Fetch available voices on component mount
  useEffect(() => {
    // Set mock voices for now
    const mockVoices = {
      english: ['idera', 'chinenye', 'jude', 'emma', 'umar', 'joke'],
      yoruba: ['yoruba_male2', 'yoruba_female2', 'yoruba_feamle1'],
      igbo: ['igbo_female2', 'igbo_male2', 'igbo_female1'],
      hausa: ['hausa_feamle1', 'hausa_female2', 'hausa_male2', 'hausa_male1']
    };
    
    setAvailableVoices(mockVoices);
    
    // Set default voice for the language
    if (mockVoices[language] && mockVoices[language].length > 0) {
      setSelectedVoice(mockVoices[language][0]);
    }
  }, []);
  
  // Update selected voice when language changes
  useEffect(() => {
    if (availableVoices[language] && availableVoices[language].length > 0) {
      setSelectedVoice(availableVoices[language][0]);
    }
  }, [language, availableVoices]);
  
  // Generate speech using the selected voice
  const generateSpeech = async () => {
    if (!text || text.trim() === '') return;
    
    // For now, use the mock implementation
    mockTTS();
    
    // In a real implementation, we would call the Python service:
    /*
    setLoading(true);
    setError(null);
    
    try {
      // First, request audio generation
      const generateResponse = await axios.post('/api/tts/proxy/generate', {
        text,
        language,
        voice: selectedVoice
      });
      
      if (generateResponse.data.success && generateResponse.data.file_id) {
        // Then set the audio URL to play
        setAudioUrl(`/api/tts/proxy/audio/${generateResponse.data.file_id}`);
      } else {
        setError('Failed to generate speech');
      }
    } catch (err) {
      console.error('Error generating speech:', err);
      setError(err.response?.data?.error || 'Failed to generate speech');
    } finally {
      setLoading(false);
    }
    */
  };
  
  return (
    <div className={`tts-component ${className}`}>
      {availableVoices[language]?.length > 0 && (
        <div className="voice-selector mb-2">
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="text-sm p-1 border rounded bg-white text-bible-ink"
            disabled={loading}
          >
            {availableVoices[language].map(voice => (
              <option key={voice} value={voice}>
                {voice.charAt(0).toUpperCase() + voice.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="controls flex items-center gap-2">
        <button
          onClick={generateSpeech}
          disabled={loading || !text}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-bible-royal text-white hover:bg-bible-royal/90'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></span>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <HiSpeakerphone className="w-4 h-4" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="error text-red-600 text-sm mt-2">
          {error}
        </div>
      )}
      
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="auto" controls className="mt-2 w-full" />
      )}
      
      <div className="text-xs text-gray-500 mt-2 italic">
        Note: You'll need to set up the Python TTS service to hear actual audio.
      </div>
    </div>
  );
};

export default TextToSpeech;