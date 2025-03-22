'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ImageGenerator from './ImageGenerator';
import VerseExplainer from './VerseExplainer';
import axios from 'axios';
import BibleNavigation from './BibleNavigation';
import { HiViewGrid, HiMenuAlt2, HiInformationCircle, HiChevronUp, HiChevronDown, HiSpeakerphone, HiX } from 'react-icons/hi';
import ThemeToggle from './ThemeToggle';  // Import ThemeToggle
import BookmarkManager from './BookmarkManager';  // Import BookmarkManager
import { useTheme } from '@/contexts/ThemeContext';  // Import useTheme hook
import { config } from '@/lib/config';
import TextToSpeech from './TextToSpeech'; // Add the import for TextToSpeech
import LoadingIndicator from './LoadingIndicator';

const BibleChapterViewer = ({ 
  book = 'Matthew',
  chapter = 1,
  language = 'english'
}) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'stacked'
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [showExplainer, setShowExplainer] = useState(false);
  const router = useRouter();
  
  // Add mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [hasSwipeListener, setHasSwipeListener] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialize mobile view mode
  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('stacked');
    }
  }, [isMobile]);

  // Setup swipe gestures for mobile
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.targetTouches[0].clientX;
      touchStartY.current = e.targetTouches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX.current = e.changedTouches[0].clientX;
      touchEndY.current = e.changedTouches[0].clientY;
      handleSwipe();
    };
    
    // Only add listeners once and only on mobile
    if (isMobile && !hasSwipeListener) {
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchend', handleTouchEnd, false);
      setHasSwipeListener(true);
    }
    
    return () => {
      if (hasSwipeListener) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isMobile, hasSwipeListener]);
  
  // Handle swipe gestures
  const handleSwipe = () => {
    const xDiff = touchStartX.current - touchEndX.current;
    const yDiff = touchStartY.current - touchEndY.current;
    
    // Horizontal swipe detection with threshold (30px)
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
      if (xDiff > 0) {
        // Swipe left - next chapter
        handleNextChapter();
      } else {
        // Swipe right - previous chapter
        handlePrevChapter();
      }
    }
  };
  
  // Navigation handlers
  const handlePrevChapter = () => {
    if (parseInt(chapter) > 1) {
      router.push(`/read?book=${book}&chapter=${parseInt(chapter) - 1}&lang=${language}`);
    }
  };
  
  const handleNextChapter = () => {
    // Assuming max chapter is 28 (for Matthew) - in a real app this would be dynamic
    if (parseInt(chapter) < 28) {
      router.push(`/read?book=${book}&chapter=${parseInt(chapter) + 1}&lang=${language}`);
    }
  };

  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const loadBibleContent = async () => {
      setLoading(true);
      try {
        // First try to load through the API
        try {
          // Update to track translation progress
          const handleTranslationProgress = (current, total) => {
            setTranslationProgress({ current, total });
          };
          
          setIsTranslating(true);
          const response = await axios.get(`/api/bible-content?book=${book}&chapter=${chapter}&language=${language}`);
          
          console.log("API response:", response.data);
          if (response.data && response.data.verses) {
            setContent(response.data);
            setCurrentVerse(1);
            if (selectedVerses.length > 0) {
              setSelectedVerses([]);
            }
            setIsTranslating(false);
            return; // Exit early if API call succeeded
          }
        } catch (apiError) {
          console.warn("API fetch failed, falling back to static data:", apiError);
          setIsTranslating(false);
        }
        
        // If API fails, fall back to static data loading
        console.log("Loading from static data for:", book, chapter, language);
        
        // Dynamically choose the right data file based on language
        try {
          // Import KJV English Bible data (all languages fall back to English for now)
          const { default: kjvData } = await import('@/data/KJV.json');
          
          // Find the correct book in the Bible data
          const bookData = kjvData.books.find(b => 
            b.name.toLowerCase() === book.toLowerCase()
          );
          
          if (!bookData) {
            console.error(`Book "${book}" not found in KJV data`);
            setLoading(false);
            return;
          }
          
          console.log(`Found book data for ${book} with ${bookData.chapters.length} chapters`);
          
          // Find the correct chapter in the book
          if (bookData.chapters.length < chapter) {
            console.error(`Chapter ${chapter} not found in ${book}, max is ${bookData.chapters.length}`);
            setLoading(false);
            return;
          }
          
          const chapterData = bookData.chapters[parseInt(chapter) - 1];
          if (!chapterData) {
            console.error(`Chapter ${chapter} data could not be retrieved for ${book}`);
            setLoading(false);
            return;
          }
          
          // Format data to match the expected structure
          const formattedVerses = chapterData.verses.map(v => ({
            number: v.verse,
            text: v.text
          }));
          
          const keyScenes = extractKeyScenes(bookData.name, parseInt(chapter), chapterData.verses);
          
          // For English, we can just set the content directly
          if (language === 'english') {
            setContent({
              book,
              chapter: parseInt(chapter),
              verses: formattedVerses,
              keyScenes
            });
          } else {
            // For non-English, we need to translate
            setIsTranslating(true);
            
            // Get translation service and translate verses with progress callback
            const { translateVerses } = await import('@/lib/services/translationService');
            const translatedVerses = await translateVerses(
              formattedVerses, 
              language, 
              'english', 
              (current, total) => setTranslationProgress({ current, total })
            );
            
            setContent({
              book,
              chapter: parseInt(chapter),
              verses: translatedVerses,
              keyScenes
            });
            
            setIsTranslating(false);
          }
          
          // Set verse to 1 when changing chapters or language
          setCurrentVerse(1);
          
          // Clear selected verses when language changes
          if (selectedVerses.length > 0) {
            setSelectedVerses([]);
          }
        } catch (staticError) {
          console.error("Failed to load from static data:", staticError);
        }
      } catch (error) {
        console.error("All Bible content loading methods failed:", error);
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
  }, [book, chapter, language, viewMode]); // Include language in dependencies

  // Helper function to extract key scenes from the chapter
  const extractKeyScenes = (bookName, chapterNum, verses) => {
    // This is a simple algorithm to identify potential key scenes
    // In a real app, you might have predefined key scenes or use NLP to identify them
    
    const scenes = [];
    const verseCount = verses.length;
    
    if (verseCount <= 10) {
      // For short chapters, consider the whole chapter as one scene
      scenes.push({
        event: `${bookName} ${chapterNum}`,
        characters: extractCharacters(verses),
        setting: extractSetting(verses),
        verseRange: [1, verseCount]
      });
    } else {
      // For longer chapters, divide into 2-3 key scenes
      const sceneSize = Math.ceil(verseCount / 3);
      
      for (let i = 0; i < verseCount; i += sceneSize) {
        const startVerse = i + 1;
        const endVerse = Math.min(i + sceneSize, verseCount);
        const sceneVerses = verses.slice(i, i + sceneSize);
        
        scenes.push({
          event: `${bookName} ${chapterNum}:${startVerse}-${endVerse}`,
          characters: extractCharacters(sceneVerses),
          setting: extractSetting(sceneVerses),
          verseRange: [startVerse, endVerse]
        });
      }
    }
    
    return scenes;
  };

  // Helper function to extract character names from text
  const extractCharacters = (verses) => {
    // This is a simple implementation - in a real app, you might use NLP or a predefined list
    const commonNames = ["Jesus", "God", "Moses", "David", "Paul", "Peter", "John"];
    const text = verses.map(v => v.text || "").join(" ");
    
    const foundNames = commonNames.filter(name => 
      text.includes(name)
    );
    
    return foundNames.length > 0 ? foundNames.join(", ") : "Biblical figures";
  };

  // Helper function to extract setting from text
  const extractSetting = (verses) => {
    // This is a simple implementation - in a real app, you might use NLP or a predefined list
    const commonPlaces = ["Jerusalem", "Temple", "Galilee", "Bethlehem", "Mount"];
    const text = verses.map(v => v.text || "").join(" ");
    
    const foundPlaces = commonPlaces.filter(place => 
      text.includes(place)
    );
    
    return foundPlaces.length > 0 ? foundPlaces.join(", ") : "Biblical setting";
  };

  // Find the current key scene based on verse
  const getCurrentScene = () => {
    if (!content || !content.keyScenes) return null;
    
    return content.keyScenes.find(scene => 
      currentVerse >= scene.verseRange[0] && 
      currentVerse <= scene.verseRange[1]
    );
  };
  
  const currentScene = getCurrentScene();

  // Update container style to be more responsive
  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: isMobile || viewMode === 'stacked' ? 'column' : 'row',
    width: isMobile ? '100%' : '80%',
    gap: isMobile ? '15px' : '30px',
    padding: isMobile ? '5px' : '10px',
    margin: '0 auto',
  };

  const textColumnStyle = {
    flex: isMobile || viewMode === 'stacked' ? '1 0 auto' : '0 0 60%',
    width: isMobile || viewMode === 'stacked' ? '100%' : '60%',
    order: isMobile || viewMode === 'stacked' ? 2 : 1
  };

  const imageColumnStyle = {
    flex: isMobile || viewMode === 'stacked' ? '1 0 auto' : '0 0 40%',
    width: isMobile || viewMode === 'stacked' ? '100%' : '40%',
    order: isMobile || viewMode === 'stacked' ? 1 : 2,
    marginBottom: isMobile || viewMode === 'stacked' ? '15px' : 0,
    position: isMobile ? 'relative' : (viewMode === 'split' ? 'sticky' : 'relative'),
    top: isMobile ? 'auto' : (viewMode === 'split' ? '20px' : 'auto'),
    maxHeight: isMobile ? 'auto' : (viewMode === 'split' ? 'calc(100vh - 60px)' : 'auto'),
    overflowY: 'auto',
    height: 'auto',
    justifyItems: 'center',
    textAlign: 'center'
  };

  // Toggle verse selection
  const toggleVerseSelection = (verseNumber) => {
    if (selectedVerses.includes(verseNumber)) {
      setSelectedVerses(selectedVerses.filter(v => v !== verseNumber));
    } else {
      setSelectedVerses([...selectedVerses, verseNumber]);
    }
  };

  // Request explanation for selected verses
  const requestExplanation = () => {
    if (selectedVerses.length > 0) {
      setShowExplainer(true);
    }
  };

  // Close the explainer
  const closeExplainer = () => {
    setShowExplainer(false);
    setSelectedVerses([]);
  };

  // Add theme context
  const { theme } = useTheme();
  const [verse, setVerse] = useState(null); // For URL verse parameter

  // Handle URL with verse parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verseParam = params.get('verse');
    if (verseParam && !isNaN(parseInt(verseParam))) {
      setVerse(parseInt(verseParam));
      setCurrentVerse(parseInt(verseParam));
    }
  }, []);

  // Add this state
  const [verseToSpeak, setVerseToSpeak] = useState(null);

  // Add this function to get verse text by number
  const getVerseTextByNumber = (verseNumber) => {
    if (!content || !content.verses) return '';
    const verse = content.verses.find(v => v.number === verseNumber);
    return verse ? verse.text : '';
  };

  return (
    <div className="bible-chapter-viewer max-w-6xl mx-auto">
      {loading ? (
        <div className="loading flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bible-gold"></div>
        </div>
      ) : isTranslating ? (
        <div className="translating flex justify-center p-12">
          <LoadingIndicator 
            message={`Translating ${book} ${chapter} to ${language}...`} 
            showProgress={true} 
            progress={translationProgress.current} 
            total={translationProgress.total} 
          />
        </div>
      ) : content ? (
        // Original content display
        <>
          {/* Theme toggle button */}
          {config.features.darkMode && (
            <ThemeToggle className="theme-toggle-btn" />
          )}
          
          {/* Floating mobile chapter navigation */}
          {isMobile && (
            <div className="fixed bottom-4 right-4 z-50">
              <button 
                onClick={() => setShowMobileControls(!showMobileControls)}
                className="bg-bible-royal text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center"
                aria-label={showMobileControls ? "Hide navigation" : "Show navigation"}
              >
                {showMobileControls ? 
                  <HiChevronDown className="w-6 h-6" /> : 
                  <HiChevronUp className="w-6 h-6" />
                }
              </button>
              
              {showMobileControls && (
                <div className="mobile-controls absolute bottom-14 right-0 bg-white rounded-lg shadow-lg p-3 border border-bible-scroll">
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    <div className="text-sm text-center text-bible-royal font-bold">
                      {book} {chapter}
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      <button 
                        onClick={handlePrevChapter}
                        className="flex-1 p-2 bg-bible-parchment rounded text-sm"
                        disabled={parseInt(chapter) <= 1}
                      >
                        Previous
                      </button>
                      <button 
                        onClick={handleNextChapter}
                        className="flex-1 p-2 bg-bible-royal text-white rounded text-sm"
                      >
                        Next
                      </button>
                    </div>
                    
                    <button 
                      onClick={requestExplanation}
                      className="p-2 bg-bible-gold text-white rounded text-sm flex items-center justify-center gap-1"
                      disabled={selectedVerses.length === 0}
                    >
                      <HiInformationCircle className="w-4 h-4" />
                      Explain Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`chapter-header mb-6 bg-bible-paper bg-opacity-80 p-${isMobile ? '3' : '6'} rounded-lg shadow-md border border-bible-scroll`}>
            <div className="flex justify-between items-center">
              {/* Add bookmarking UI */}
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <div className="flex items-center gap-2 bg-bible-parchment p-2 rounded-md border border-bible-scroll">
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
                )}
                
                {/* Add bookmark manager */}
                {config.features.bookmarking && (
                  <BookmarkManager
                    currentBook={book}
                    currentChapter={chapter}
                    currentVerse={currentVerse}
                    language={language}
                    isMobile={isMobile}
                  />
                )}
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
                isMobile={isMobile}
                onLanguageChange={(newLanguage) => 
                  router.push(`/read?book=${book}&chapter=${chapter}&lang=${newLanguage}`)} 
              />
            </div>

            {/* Add Verse Selection Tools */}
            {selectedVerses.length > 0 && (
              <div className={`mt-4 ${isMobile ? 'flex-col' : 'flex justify-between'} items-${isMobile ? 'start' : 'center'}`}>
                <div className="text-bible-royal">
                  <span className="font-biblical">{selectedVerses.length} verse(s) selected</span>
                </div>
                <div className={`flex gap-2 ${isMobile ? 'mt-2' : ''}`}>
                  <button
                    onClick={() => setSelectedVerses([])}
                    className="biblical-btn bg-gray-500 text-white px-3 py-1 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={requestExplanation}
                    className="biblical-btn bg-bible-royal text-white px-3 py-1 text-sm flex items-center gap-1"
                  >
                    <HiInformationCircle className="w-4 h-4" />
                    Explain
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={containerStyle}>
            {/* Image column - now shows first on mobile */}
            <div style={imageColumnStyle}>
              {currentScene ? (
                <div className="bg-white rounded-lg shadow-lg border border-bible-scroll overflow-hidden">
                  {isMobile ? (
                    <div className="pt-2 px-3 text-center text-sm text-bible-royal">
                      <h3 className="font-bold font-biblical">
                        {book} {chapter}:{currentVerse} - {currentScene.event}
                      </h3>
                    </div>
                  ) : (
                    <div className="pt-4 px-4 text-center">
                      {/* Original desktop heading */}
                    </div>
                  )}
                  
                  <ImageGenerator 
                    biblicalEvent={currentScene.event}
                    characters={currentScene.characters}
                    setting={currentScene.setting}
                    language={language}
                    region="Yoruba"
                    book={book}
                    chapter={chapter}
                    fixedHeight={!isMobile && viewMode === 'split'}
                  />
                  
                  <div className={`p-${isMobile ? '2' : '4'} border-t border-bible-scroll bg-bible-parchment`}>
                    <div className={`mt-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'} text-bible-ink font-biblical`}>
                      <div><span className="font-medium text-bible-royal">Characters:</span> {currentScene.characters}</div>
                      <div><span className="font-medium text-bible-royal">Setting:</span> {currentScene.setting}</div>
                      <div className={`${isMobile ? 'text-2xs' : 'text-xs'} mt-${isMobile ? '1' : '3'} text-bible-ink opacity-70`}>
                        Verses {currentScene.verseRange[0]}-{currentScene.verseRange[1]}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`placeholder-image bg-white ${isMobile ? 'h-40' : 'h-64'} flex items-center justify-center rounded-lg shadow-md border border-bible-scroll`}>
                  <p className="text-bible-scroll font-biblical text-center px-4">
                    {isMobile ? "Tap a verse to see imagery" : "Select a verse to visualize the scene"}
                  </p>
                </div>
              )}
              
              {/* Mobile helper text */}
              {isMobile && (
                <div className="text-xs text-center mt-2 text-gray-500 italic">
                  Swipe left/right to change chapters
                </div>
              )}
            </div>
            
            {/* Text column */}
            <div style={textColumnStyle} className="bible-text">
              <div className="bible-paper">
                <h3 className="text-xl font-semibold mb-4 text-center font-biblical border-b pb-3 text-bible-royal">
                  Scripture Text
                </h3>
                <div className="space-y-2 font-biblical text-lg leading-relaxed">
                  {content.verses.map(verse => (
                    <div 
                      key={verse.number}
                      className={`verse transition-colors duration-200 ${
                        currentVerse === verse.number ? 'bg-bible-scroll bg-opacity-20 rounded-md p-2' : ''
                      } ${selectedVerses.includes(verse.number) ? 'bg-bible-royal bg-opacity-10 border-l-4 border-bible-royal' : ''}`}
                      onClick={() => {
                        setCurrentVerse(verse.number);
                        // On mobile, selecting a verse adds/removes it from selection
                        if (isMobile) {
                          toggleVerseSelection(verse.number);
                        }
                      }}
                    >
                      <div className="flex items-start">
                        {!isMobile && (
                          <input 
                            type="checkbox"
                            className="mt-2 mr-2"
                            checked={selectedVerses.includes(verse.number)}
                            onChange={() => toggleVerseSelection(verse.number)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex-grow">
                          <span className={`verse-number ${isMobile ? 'font-bold text-bible-gold' : ''}`}>
                            {verse.number}
                          </span>
                          <span className="verse-text ml-1">{verse.text}</span>
                          
                          {/* Add a button to speak this verse */}
                          <button 
                            className="ml-2 text-bible-royal hover:text-bible-gold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerseToSpeak(verse.number);
                            }}
                            title="Listen to this verse"
                          >
                            <HiSpeakerphone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Verse Explainer Modal */}
          {showExplainer && content && (
            <VerseExplainer
              verses={selectedVerses.map(num => content.verses.find(v => v.number === num))}
              book={book}
              chapter={chapter}
              language={language}
              isMobile={isMobile}
              onClose={closeExplainer}
            />
          )}

          {/* Add the TTS component at the bottom of your component, before the closing tags */}
          {verseToSpeak && (
            <div className="fixed bottom-16 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-bible-scroll max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-bible-royal">
                  Listen to verse {verseToSpeak}
                </span>
                <button 
                  onClick={() => setVerseToSpeak(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </div>
              <TextToSpeech 
                text={getVerseTextByNumber(verseToSpeak)} 
                language={language}
              />
            </div>
          )}
        </>
      ) : (
        <div className="error-state flex justify-center p-12">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
            No content available for {book} {chapter} in {language}.
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleChapterViewer;