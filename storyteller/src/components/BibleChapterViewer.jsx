'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageGenerator from './ImageGenerator';
import axios from 'axios';

const BibleChapterViewer = ({ 
  book = 'Matthew',
  chapter = 1,
  language = 'english'
}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentVerse, setCurrentVerse] = useState(1);
  const router = useRouter();
  
  useEffect(() => {
    const loadBibleContent = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/bible-content?book=${book}&chapter=${chapter}&language=${language}`);
        setContent(response.data);
        // Set verse to 1 when changing chapters
        setCurrentVerse(1);
      } catch (error) {
        console.error("Failed to fetch Bible content", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (book && chapter) {
      loadBibleContent();
    }
  }, [book, chapter, language]);
  
  // Find the current key scene based on verse
  const getCurrentScene = () => {
    if (!content || !content.keyScenes) return null;
    
    return content.keyScenes.find(scene => 
      currentVerse >= scene.verseRange[0] && 
      currentVerse <= scene.verseRange[1]
    );
  };
  
  const currentScene = getCurrentScene();
  
  return (
    <div className="bible-chapter-viewer max-w-4xl mx-auto p-4">
      {loading ? (
        <div className="loading flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="chapter-header mb-6">
            <h2 className="text-2xl font-bold">{content.book} {content.chapter}</h2>
            <div className="language-selector mt-2">
              <label className="mr-2">Language:</label>
              <select 
                value={language} 
                onChange={(e) => router.push(`/?book=${book}&chapter=${chapter}&lang=${e.target.value}`)}
                className="border rounded px-2 py-1"
              >
                <option value="english">English</option>
                <option value="yoruba">Yoruba</option>
                <option value="pidgin">Nigerian Pidgin</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="bible-content md:w-1/2">
              {content.verses.map(verse => (
                <div 
                  key={verse.number}
                  className={`verse mb-4 ${currentVerse === verse.number ? 'bg-yellow-100 p-2 rounded' : ''}`}
                  onClick={() => setCurrentVerse(verse.number)}
                >
                  <span className="verse-number font-bold mr-2">{verse.number}.</span>
                  <span className="verse-text">{verse.text}</span>
                </div>
              ))}
            </div>
            
            <div className="scene-visualization md:w-1/2">
              {currentScene ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg shadow">
                    <ImageGenerator 
                      biblicalEvent={currentScene.event}
                      characters={currentScene.characters}
                      setting={currentScene.setting}
                      language={language}
                      region="Yoruba"
                    />
                    <div className="scene-description mt-4 text-sm text-gray-600">
                      <div className="font-bold">{currentScene.event}</div>
                      <div>Characters: {currentScene.characters}</div>
                      <div>Setting: {currentScene.setting}</div>
                      <div className="text-xs mt-1 text-gray-500">Verses {currentScene.verseRange[0]}-{currentScene.verseRange[1]}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="placeholder-image bg-gray-100 h-64 flex items-center justify-center rounded-lg shadow-inner">
                  <p className="text-gray-500">Select a verse to visualize the scene</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BibleChapterViewer;