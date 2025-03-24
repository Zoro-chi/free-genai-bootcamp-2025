'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

const DevDebugInfo = () => {
  const [envVariables, setEnvVariables] = useState({});

  useEffect(() => {
    // Collect environment variables that are safe to expose
    setEnvVariables({
      NEXT_PUBLIC_USE_MOCK_IMAGES: process.env.NEXT_PUBLIC_USE_MOCK_IMAGES,
      configUseMockImages: config.imageGeneration.useMockImages,
      NEXT_PUBLIC_ENABLE_REAL_TRANSLATION: process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  const clearAllCaches = () => {
    localStorage.clear();
    sessionStorage.clear();
    alert('All caches cleared. Reloading page...');
    window.location.reload();
  };

  return (
    <div className="p-3 bg-gray-100 rounded border text-xs font-mono">
      <h3 className="font-bold mb-2">Developer Debug Info</h3>
      <div className="mb-2">
        <div className="flex justify-between">
          <span className="font-bold">Image Generation Mode:</span>
          <span className={config.imageGeneration.useMockImages ? "text-yellow-600" : "text-green-600"}>
            {config.imageGeneration.useMockImages ? "MOCK IMAGES" : "REAL IMAGES (OpenAI)"}
          </span>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="font-bold">Environment Variables:</div>
        <ul className="pl-2">
          {Object.entries(envVariables).map(([key, value]) => (
            <li key={key} className="flex justify-between">
              <span>{key}:</span>
              <span>{value === undefined ? "undefined" : String(value)}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex justify-between space-x-2">
        <button 
          onClick={clearAllCaches}
          className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-xs w-full"
        >
          Clear All Caches
        </button>

        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs w-full"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default DevDebugInfo;
