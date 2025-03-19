'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiX } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';

const VerseExplainer = ({ 
  verses = [], 
  book, 
  chapter,
  language = 'english',
  isMobile = false,
  onClose 
}) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchExplanation = async () => {
      if (!verses || verses.length === 0) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const verseTexts = verses.map(v => `Verse ${v.number}: ${v.text}`).join('\n\n');
        
        const response = await axios.post('/api/explain', {
          book,
          chapter,
          verses: verses.map(v => v.number),
          verseTexts,
          language
        });
        
        if (response.data && response.data.explanation) {
          setExplanation(response.data.explanation);
        } else {
          throw new Error('No explanation received');
        }
      } catch (err) {
        console.error("Failed to fetch explanation", err);
        setError(`Couldn't get explanation: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExplanation();
  }, [verses, book, chapter, language]);
  
  if (!verses || verses.length === 0) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${isMobile ? 'w-full' : 'max-w-2xl w-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-bible-scroll bg-bible-parchment">
          <h3 className="font-biblical text-bible-royal font-bold">
            {book} {chapter}:{verses.map(v => v.number).join(', ')}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`p-${isMobile ? '3' : '6'} overflow-y-auto max-h-[70vh]`}>
          {/* Selected verses */}
          <div className="verses mb-6 bg-bible-parchment bg-opacity-50 p-4 rounded-md">
            {verses.map(verse => (
              <div key={verse.number} className="verse mb-2 last:mb-0">
                <span className="verse-number font-bold text-bible-gold">{verse.number}</span>
                <span className="verse-text ml-2">{verse.text}</span>
              </div>
            ))}
          </div>
          
          {/* Explanation */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-bible-gold"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">{error}</div>
          ) : (
            <div className="explanation">
              <h4 className={`${isMobile ? 'text-lg' : 'text-xl'} font-biblical font-bold mb-3 text-bible-royal`}>Explanation</h4>
              <div className="prose max-w-none">
                <ReactMarkdown>{explanation}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-bible-scroll bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bible-royal text-white rounded-md hover:bg-bible-royal/80"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerseExplainer;
