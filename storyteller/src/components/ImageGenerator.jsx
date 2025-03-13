'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const ImageGenerator = ({ 
  biblicalEvent, 
  characters, 
  setting,
  language = 'english', 
  region = 'Yoruba' 
}) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const generateSceneImage = async () => {
      // Only generate if we have the minimum required context
      if (!biblicalEvent && !characters) return;
      
      try {
        setLoading(true);
        
        // Call our API endpoint instead of direct import
        const response = await axios.post('/api/generate-image', {
          biblicalEvent,
          characters,
          setting,
          language,
          region
        });
        
        setImage(response.data.imageUrl);
      } catch (err) {
        console.error("Failed to generate image:", err);
        setError("Could not generate the requested image");
      } finally {
        setLoading(false);
      }
    };
    
    generateSceneImage();
  }, [biblicalEvent, characters, setting, language, region]);
  
  return (
    <div className="image-generator">
      {loading && (
        <div className="loading-state">
          <div className="animate-pulse bg-gray-300 h-64 w-full rounded"></div>
          <p className="text-center mt-2">Generating image...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state">
          <p className="text-red-500">{error}</p>
          <p>Using fallback image instead</p>
        </div>
      )}
      
      {!loading && !error && image && (
        <div className="image-container">
          <img 
            src={image} 
            alt={`${biblicalEvent || ''} ${characters || ''}`}
            className="w-full rounded shadow-lg" 
          />
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;