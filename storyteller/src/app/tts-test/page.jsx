'use client';

import { useState } from 'react';
import TextToSpeech from '@/components/TextToSpeech';
import Link from 'next/link';

export default function TTSTestPage() {
  const [text, setText] = useState("The LORD is my shepherd; I shall not want.");
  const [language, setLanguage] = useState("english");
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Text-to-Speech Test</h1>
        <Link href="/" className="text-bible-royal hover:underline">
          Back to Home
        </Link>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Text to speak:</label>
        <textarea 
          className="w-full p-2 border rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="4"
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Language:</label>
        <select 
          className="p-2 border rounded"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="english">English</option>
          <option value="yoruba">Yoruba</option>
          <option value="igbo">Igbo</option>
          <option value="hausa">Hausa</option>
        </select>
      </div>
      
      <div className="mt-6 p-4 border rounded">
        <TextToSpeech text={text} language={language} />
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border rounded">
        <h2 className="text-lg font-semibold mb-2">Setup Instructions:</h2>
        <p className="mb-2">
          To use actual TTS functionality with YarnGPT:
        </p>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Set up the Python TTS service in <code className="bg-gray-100 px-1">tts-service/</code> folder</li>
          <li>Install dependencies: <code className="bg-gray-100 px-1">pip install -r requirements.txt</code></li>
          <li>Start the service: <code className="bg-gray-100 px-1">python app.py</code></li>
          <li>Ensure your Next.js app is configured to use the TTS service</li>
        </ol>
      </div>
    </div>
  );
}
