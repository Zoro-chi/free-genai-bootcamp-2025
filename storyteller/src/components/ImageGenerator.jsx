'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { findImageForScene } from '@/lib/imageMapping';
import Image from 'next/image';
import { HiOutlineZoomIn } from 'react-icons/hi';

const ImageGenerator = ({ 
  biblicalEvent, 
  characters, 
  setting,
  language = 'english', 
  region = 'Yoruba',
  book,
  chapter
}) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageSource, setImageSource] = useState('pregenerated'); // 'pregenerated' or 'generated'
  const [isZoomed, setIsZoomed] = useState(false);
  
  useEffect(() => {
    const loadImage = async () => {
      // Only proceed if we have the minimum required context
      if (!biblicalEvent && !characters) return;
      
      setLoading(true);
      
      try {
        // First try to find a pre-generated image
        if (book && chapter && biblicalEvent) {
          const pregenImage = findImageForScene(book, chapter, biblicalEvent);
          
          if (pregenImage) {
            // We found a matching pre-generated image
            setImage(pregenImage);
            setImageSource('pregenerated');
            setLoading(false);
            return;
          }
        }
        
        // If no pre-generated image is found, generate one on-the-fly
        setImageSource('generated');
        
        // Call our API endpoint
        const response = await axios.post('/api/generate-image', {
          biblicalEvent,
          characters,
          setting,
          language,
          region
        });
        
        setImage(response.data.imageUrl);
      } catch (err) {
        console.error("Failed to load or generate image:", err);
        setError("Could not display the requested image");
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [biblicalEvent, characters, setting, language, region, book, chapter]);
  
  return (
    <div className="image-generator relative">
      {loading && (
        <div className="loading-state">
          <div className="animate-pulse bg-gray-300 h-64 w-full rounded"></div>
          <p className="text-center mt-2">Loading scene visualization...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {!loading && !error && image && (
        <div className="image-container">
          {/* Overlay for zoomed image */}
          {isZoomed && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
              onClick={() => setIsZoomed(false)}
            >
              <img 
                src={image} 
                alt={`${biblicalEvent || ''} ${characters || ''}`}
                className="max-h-screen max-w-full object-contain" 
              />
              <button 
                className="absolute top-4 right-4 text-white text-xl font-bold"
                onClick={() => setIsZoomed(false)}
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="relative group">
            {imageSource === 'pregenerated' ? (
              <Image 
                src={image} 
                alt={`${biblicalEvent || ''} ${characters || ''}`}
                width={500}
                height={500}
                className="w-full scene-image object-cover aspect-[4/3]" 
                priority
              />
            ) : (
              <img 
                src={image} 
                alt={`${biblicalEvent || ''} ${characters || ''}`}
                className="w-full scene-image object-cover aspect-[4/3]" 
              />
            )}
            
            {/* Zoom button */}
            <button
              onClick={() => setIsZoomed(true)}
              className="absolute bottom-2 right-2 bg-white bg-opacity-70 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Zoom image"
            >
              <HiOutlineZoomIn className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-1 text-right">
            {imageSource === 'pregenerated' ? 'Pre-generated image' : 'AI-generated image'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;