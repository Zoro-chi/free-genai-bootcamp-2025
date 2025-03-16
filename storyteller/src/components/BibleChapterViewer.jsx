'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageGenerator from './ImageGenerator';
import axios from 'axios';
import BibleNavigation from './BibleNavigation';
// Fixed icon imports
import { HiViewGrid, HiMenuAlt2 } from 'react-icons/hi';

const BibleChapterViewer = ({ 
  book = 'Matthew',
  chapter = 1,
  language = 'english'
}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'stacked'
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
    <div className="bible-chapter-viewer max-w-6xl mx-auto p-4">
      {loading ? (
        <div className="loading flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="chapter-header mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{content.book} {content.chapter}</h2>
              
              {/* View Mode Toggle - using available icons */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded">
                <button 
                  onClick={() => setViewMode('split')}
                  className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-white shadow' : ''}`}
                  title="Split View"
                >
                  <HiViewGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('stacked')}
                  className={`p-1.5 rounded ${viewMode === 'stacked' ? 'bg-white shadow' : ''}`}
                  title="Stacked View"
                >
                  <HiMenuAlt2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Add Bible Navigation component */}
            <div className="mt-4 border-t pt-4">
              <BibleNavigation currentBook={book} currentChapter={parseInt(chapter)} />
            </div>
            
            <div className="language-selector mt-4">
              <label className="mr-2">Language:</label>
              <select 
                value={language} 
                onChange={(e) => router.push(`/read?book=${book}&chapter=${chapter}&lang=${e.target.value}`)}
                className="border rounded px-2 py-1"
              >
                <option value="english">English</option>
                <option value="yoruba">Yoruba</option>
                <option value="pidgin">Nigerian Pidgin</option>
              </select>
            </div>
          </div>
          
          {/* Fix the container to ensure flex is applied properly */}
          <div className={`${viewMode === 'split' ? 'lg:flex lg:flex-row' : ''} gap-6`}>
            
            {/* BIBLE TEXT SECTION - Left side (60%) */}
            <div className={`${viewMode === 'split' ? 'lg:w-3/5' : 'w-full'} mb-6 lg:mb-0`}>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Scripture Text</h3>
                <div className="space-y-4">
                  {content.verses.map(verse => (
                    <div 
                      key={verse.number}
                      className={`verse transition-colors duration-200 ${
                        currentVerse === verse.number ? 'bg-yellow-100 p-2 rounded' : ''
                      }`}
                      onClick={() => setCurrentVerse(verse.number)}
                    >
                      <span className="verse-number font-bold mr-2">{verse.number}.</span>
                      <span className="verse-text">{verse.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* IMAGE SECTION - Right side (40%) */}
            <div className={`${viewMode === 'split' ? 'lg:w-2/5' : 'w-full'}`}>
              {currentScene ? (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <ImageGenerator 
                    biblicalEvent={currentScene.event}
                    characters={currentScene.characters}
                    setting={currentScene.setting}
                    language={language}
                    region="Yoruba"
                    book={book}
                    chapter={chapter}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{currentScene.event}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <div><span className="font-medium">Characters:</span> {currentScene.characters}</div>
                      <div><span className="font-medium">Setting:</span> {currentScene.setting}</div>
                      <div className="text-xs mt-2 text-gray-500">Verses {currentScene.verseRange[0]}-{currentScene.verseRange[1]}</div>
                    </div>
                  </div>
                </div>
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