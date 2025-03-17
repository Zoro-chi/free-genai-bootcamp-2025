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

    console.log("viewMode", viewMode);
    
    // Save view mode preference to localStorage
    if (viewMode) {
      localStorage.setItem('bibleViewMode', viewMode);
    }
  }, [book, chapter, language, viewMode]); // Added viewMode dependency

  // Initialize view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('bibleViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);
  
  // Find the current key scene based on verse
  const getCurrentScene = () => {
    if (!content || !content.keyScenes) return null;
    
    return content.keyScenes.find(scene => 
      currentVerse >= scene.verseRange[0] && 
      currentVerse <= scene.verseRange[1]
    );
  };
  
  const currentScene = getCurrentScene();

  // Direct styles using flexbox instead of table layout
  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: viewMode === 'split' ? 'row' : 'column',
    width: '80%',
    gap: '30px',
    padding: '10px',
    margin: '0 auto',
  };

  const textColumnStyle = {
    flex: viewMode === 'split' ? '0 0 60%' : '1 0 auto',
    width: viewMode === 'split' ? '60%' : '100%',
    order: viewMode === 'split' ? 1 : 2
  };

  const imageColumnStyle = {
    flex: viewMode === 'split' ? '0 0 40%' : '1 0 auto',
    width: viewMode === 'split' ? '40%' : '100%',
    order: viewMode === 'split' ? 2 : 1,
    marginBottom: viewMode === 'split' ? 0 : '20px',
    // Add sticky positioning for desktop view
    position: viewMode === 'split' ? 'sticky' : 'relative',
    top: viewMode === 'split' ? '20px' : 'auto',
    alignSelf: 'flex-start', // Prevents stretching the sticky element
    maxHeight: viewMode === 'split' ? 'calc(100vh - 60px)' : 'auto', // Limit height to viewport with some padding
    overflowY: 'auto', // Allow scrolling if content is tall
    // Add fixed height for the image container to avoid scrolling issues
    height: viewMode === 'split' ? 'auto' : 'auto',
    justifyItems: 'center',
    textAlign: 'center'
  };

  return (
    <div className="bible-chapter-viewer max-w-6xl mx-auto">
      {loading ? (
        <div className="loading flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bible-gold"></div>
        </div>
      ) : (
        <>
          <div className="chapter-header mb-6 bg-white bg-opacity-80 p-6 rounded-lg shadow-md border border-bible-scroll">
            <div className="flex justify-between items-center">
              {/* Remove the redundant heading that shows book and chapter */}
              
              {/* View Mode Toggle - using available icons */}
              <div className="ml-auto flex items-center gap-2 bg-bible-parchment p-2 rounded-md border border-bible-scroll">
                <button 
                  onClick={() => setViewMode('split')}
                  className={`p-2 rounded-md ${viewMode === 'split' ? 'bg-white shadow-md text-bible-royal' : 'text-bible-ink'}`}
                  title="Split View"
                >
                  <HiViewGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('stacked')}
                  className={`p-2 rounded-md ${viewMode === 'stacked' ? 'bg-white shadow-md text-bible-royal' : 'text-bible-ink'}`}
                  title="Stacked View"
                >
                  <HiMenuAlt2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="chapter-divider">
              <span className="mx-4 text-bible-gold">✦</span>
            </div>
            
            {/* Updated Bible Navigation with language handling */}
            <div className="mt-6">
              <BibleNavigation 
                currentBook={book}
                currentChapter={parseInt(chapter)}
                language={language}
                onLanguageChange={(newLanguage) => 
                  router.push(`/read?book=${book}&chapter=${chapter}&lang=${newLanguage}`)} 
              />
            </div>
          </div>
          
          {/* Remove the separate language selector since it's now in the navigation component */}
          
          <div style={containerStyle}>
            {/* Left column - Bible Text */}
            <div style={textColumnStyle} className="bible-text">
              <div className="bible-paper">
                <h3 className="text-xl font-semibold mb-8 text-center font-biblical border-b pb-4 text-bible-royal" style={{ textAlign: 'center' }}>
                  Scripture Text
                </h3>
                <div className="space-y-2 font-biblical text-lg leading-relaxed">
                  {content.verses.map(verse => (
                    <div 
                      key={verse.number}
                      className={`verse transition-colors duration-200 ${
                        currentVerse === verse.number ? 'bg-bible-scroll bg-opacity-20 rounded-md p-3' : ''
                      }`}
                      onClick={() => setCurrentVerse(verse.number)}
                      style={{ textAlign: 'center' }}
                    >
                      <span className="verse-number">{verse.number}</span>
                      <span className="verse-text">{verse.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right column - Image */}
            <div style={{...imageColumnStyle, textAlign: 'center'}}>
              {currentScene ? (
                <div className="bg-white rounded-lg shadow-lg border border-bible-scroll overflow-hidden">
                  <div className="pt-4 px-4 text-center" style={{ textAlign: 'center' }}>
                    {/* <h3 className="font-bold text-bible-royal font-biblical text-xl mb-2">{currentScene.event}</h3> */}
                  </div>
                  
                  <ImageGenerator 
                    biblicalEvent={currentScene.event}
                    characters={currentScene.characters}
                    setting={currentScene.setting}
                    language={language}
                    region="Yoruba"
                    book={book}
                    chapter={chapter}
                    fixedHeight={viewMode === 'split'}
                  />
                  
                  <div className="p-4 border-t border-bible-scroll bg-bible-parchment" style={{ textAlign: 'center' }}>
                    <div className="mt-2 text-sm text-bible-ink font-biblical" style={{ textAlign: 'center' }}>
                      <div style={{ textAlign: 'center' }}><span className="font-medium text-bible-royal">Characters:</span> {currentScene.characters}</div>
                      <div style={{ textAlign: 'center' }}><span className="font-medium text-bible-royal">Setting:</span> {currentScene.setting}</div>
                      <div className="text-xs mt-3 text-bible-ink opacity-70" style={{ textAlign: 'center' }}>Verses {currentScene.verseRange[0]}-{currentScene.verseRange[1]}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="placeholder-image bg-white h-64 flex items-center justify-center rounded-lg shadow-md border border-bible-scroll" style={{ textAlign: 'center' }}>
                  <p className="text-bible-scroll font-biblical text-center px-4" style={{ textAlign: 'center' }}>Select a verse to visualize the scene</p>
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