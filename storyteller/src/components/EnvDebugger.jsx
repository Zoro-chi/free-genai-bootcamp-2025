'use client';

import { useState, useEffect } from 'react';
import { isAwsConfigured } from '@/lib/aws-config';

export default function EnvDebugger() {
  const [showEnv, setShowEnv] = useState(false);
  const [awsStatus, setAwsStatus] = useState('checking');
  
  // Only extract NEXT_PUBLIC_ environment variables
  const publicEnv = {};
  if (typeof window !== 'undefined') {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        publicEnv[key] = process.env[key];
      }
    });
  }

  useEffect(() => {
    // Check AWS credentials on component mount
    const checkAwsCredentials = async () => {
      try {
        // Use the isAwsConfigured helper
        const isConfigured = isAwsConfigured();
        setAwsStatus(isConfigured ? 'ok' : 'missing');
      } catch (error) {
        console.error('Error checking AWS credentials:', error);
        setAwsStatus('error');
      }
    };

    checkAwsCredentials();
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-1 px-2 rounded flex items-center gap-2"
        onClick={() => setShowEnv(!showEnv)}
      >
        <span className={`h-2 w-2 rounded-full ${
          awsStatus === 'ok' ? 'bg-green-500' :
          awsStatus === 'missing' ? 'bg-yellow-500' : 
          'bg-red-500'
        }`}></span>
        {showEnv ? 'Hide ENV' : 'Show ENV'}
      </button>
      
      {showEnv && (
        <div className="bg-gray-900 text-white p-4 mt-2 rounded shadow-lg max-w-xs overflow-auto max-h-60">
          <h4 className="font-bold mb-2 text-xs">Environment Status:</h4>
          
          <div className="mb-4 border-b border-gray-700 pb-2">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${
                awsStatus === 'ok' ? 'bg-green-500' :
                awsStatus === 'missing' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></span>
              <span>AWS Credentials: {
                awsStatus === 'ok' ? 'Valid' :
                awsStatus === 'missing' ? 'Missing' :
                'Error'
              }</span>
            </div>
          </div>
          
          <h4 className="font-bold mb-2 text-xs">Public Environment Variables:</h4>
          <pre className="text-xs whitespace-pre-wrap">
            {Object.entries(publicEnv).map(([key, value]) => (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </pre>
          <div className="mt-4 text-xs">
            <p>Translation Provider: {process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'not set'}</p>
            <p>Real Translation: {process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION === 'true' ? 'true' : 'false'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
