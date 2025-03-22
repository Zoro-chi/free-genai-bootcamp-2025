'use client';

import { useState, useEffect } from 'react';

const CacheManager = () => {
  const [cacheStats, setCacheStats] = useState({
    translations: 0,
    images: 0,
    bibleContent: 0
  });
  
  useEffect(() => {
    // Get cache statistics
    const getCacheStats = () => {
      let stats = { translations: 0, images: 0, bibleContent: 0 };
      
      try {
        // Check translation cache
        const translationCache = localStorage.getItem('storyteller-translation-cache');
        if (translationCache) {
          const parsed = JSON.parse(translationCache);
          let count = 0;
          Object.keys(parsed).forEach(lang => {
            if (typeof parsed[lang] === 'object') {
              count += Object.keys(parsed[lang]).length;
            }
          });
          stats.translations = count;
        }
        
        // Check image cache
        const imageCache = localStorage.getItem('storyteller-image-cache');
        if (imageCache) {
          const parsed = JSON.parse(imageCache);
          stats.images = Object.keys(parsed).length;
        }
        
        // Check Bible content cache
        const bibleCache = localStorage.getItem('storyteller-bible-content-cache');
        if (bibleCache) {
          const parsed = JSON.parse(bibleCache);
          stats.bibleContent = Object.keys(parsed).length;
        }
      } catch (error) {
        console.error('Error getting cache stats:', error);
      }
      
      setCacheStats(stats);
    };
    
    getCacheStats();
  }, []);
  
  const clearCache = (type) => {
    try {
      switch (type) {
        case 'translations':
          localStorage.removeItem('storyteller-translation-cache');
          break;
        case 'images':
          localStorage.removeItem('storyteller-image-cache');
          break;
        case 'bibleContent':
          localStorage.removeItem('storyteller-bible-content-cache');
          break;
        case 'all':
          localStorage.removeItem('storyteller-translation-cache');
          localStorage.removeItem('storyteller-image-cache');
          localStorage.removeItem('storyteller-bible-content-cache');
          break;
      }
      
      // Refresh stats
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Cached Content</h2>
      
      <div className="mb-4">
        <div className="mb-2">
          <span className="font-semibold">Translations:</span> {cacheStats.translations} items
        </div>
        <div className="mb-2">
          <span className="font-semibold">Images:</span> {cacheStats.images} items
        </div>
        <div className="mb-2">
          <span className="font-semibold">Bible Content:</span> {cacheStats.bibleContent} items
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => clearCache('translations')} 
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Clear Translations
        </button>
        <button 
          onClick={() => clearCache('images')} 
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Clear Images
        </button>
        <button 
          onClick={() => clearCache('bibleContent')} 
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Clear Bible Content
        </button>
        <button 
          onClick={() => clearCache('all')} 
          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm"
        >
          Clear All
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Clearing cache will free up storage space but may result in slower loading for non-English content.
      </div>
    </div>
  );
};

export default CacheManager;
