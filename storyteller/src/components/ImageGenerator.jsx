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
  chapter,
  fixedHeight = false // Add new prop for fixed height
}) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageSource, setImageSource] = useState('pregenerated'); // 'pregenerated' or 'generated'
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Cache key for localStorage
  const IMAGE_CACHE_KEY = 'storyteller-image-cache';

  // Initialize cache
  let imageCache = {};

  // Load cache on mount (client-side only)
  useEffect(() => {
    // Only load cache on client-side
    if (typeof window !== 'undefined') {
      try {
        const savedCache = localStorage.getItem(IMAGE_CACHE_KEY);
        if (savedCache) {
          imageCache = JSON.parse(savedCache);
          console.log(`Loaded ${Object.keys(imageCache).length} image references from cache`);
        }
      } catch (error) {
        console.error('Failed to load image cache:', error);
      }
    }
  }, []);

  // Save cache function
  const saveImageCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
      } catch (error) {
        console.error('Failed to save image cache:', error);
        
        // If it's a quota error, prune the cache
        if (error.name === 'QuotaExceededError') {
          const keys = Object.keys(imageCache);
          // Keep only the last 20 entries
          if (keys.length > 20) {
            const newCache = {};
            keys.slice(-20).forEach(key => {
              newCache[key] = imageCache[key];
            });
            imageCache = newCache;
            localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
          }
        }
      }
    }
  };

  // Define fixed height styles
  const imageContainerStyle = fixedHeight ? {
    height: '400px',    // Fixed height for the container
    overflow: 'hidden', // Hide overflow
    position: 'relative'
  } : {};
  
  const imageStyle = fixedHeight ? {
    objectFit: 'cover',
    width: '100%',
    height: '100%'
  } : {};
  
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
        
        // Generate a cache key from props
        const cacheKey = `${biblicalEvent}-${characters}-${setting}-${language}-${region}`;

        // Check cache before making API call
        if (imageCache[cacheKey]) {
          setImage(imageCache[cacheKey]);
          setLoading(false);
          return;
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
        
        if (response.data && response.data.imageUrl) {
          const imageUrl = response.data.imageUrl;
          // Only cache successful API responses
          imageCache[cacheKey] = imageUrl;
          saveImageCache();
          setImage(imageUrl);
        }
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
          
          <div className="relative group" style={imageContainerStyle}>
            {imageSource === 'pregenerated' ? (
              <Image 
                src={image} 
                alt={`${biblicalEvent || ''} ${characters || ''}`}
                width={500}
                height={500}
                className="scene-image object-cover" 
                style={imageStyle}
                priority
              />
            ) : (
              <img 
                src={image} 
                alt={`${biblicalEvent || ''} ${characters || ''}`}
                className="scene-image object-cover" 
                style={imageStyle}
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