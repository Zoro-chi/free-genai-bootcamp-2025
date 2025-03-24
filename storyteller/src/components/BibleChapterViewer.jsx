'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ImageGenerator from './ImageGenerator';
import VerseExplainer from './VerseExplainer';
import axios from 'axios';
import BibleNavigation from './BibleNavigation';
import { HiViewGrid, HiMenuAlt2, HiInformationCircle, HiChevronUp, HiChevronDown, HiSpeakerphone, HiX } from 'react-icons/hi';
import ThemeToggle from './ThemeToggle';
import BookmarkManager from './BookmarkManager';
import { useTheme } from '@/contexts/ThemeContext';
import { config } from '@/lib/config';
import LoadingIndicator from './LoadingIndicator';
import { generateChapterImages, getImageForVerse, clearImageCache } from '@/services/chapterImageService';
import BibleImageLoader from './BibleImageLoader';

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
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [isTranslating, setIsTranslating] = useState(false);
  const router = useRouter();
  
  // Add mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [hasSwipeListener, setHasSwipeListener] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  // Add state for collapsible image section on mobile
  const [isImageCollapsed, setIsImageCollapsed] = useState(false);
  
  // Add new state for chapter images
  const [chapterImages, setChapterImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  
  // Add state for tracking visible verses during scroll
  const [visibleVerses, setVisibleVerses] = useState([]);
  const versesRef = useRef({});
  
  // Add state for mock image toggle - fix environment variable handling
  const [useMockImages, setUseMockImages] = useState(() => {
    // Handle default state based on environment or localStorage
    if (typeof window !== 'undefined') {
      // If localStorage has a value, use it
      const storedValue = localStorage.getItem('useMockImages');
      if (storedValue !== null) {
        return storedValue === 'true';
      }
      
      // Otherwise check environment variable - explicitly handle 'false'
      const envValue = process.env.NEXT_PUBLIC_USE_MOCK_IMAGES;
      if (envValue === 'false') {
        return false;
      }
      if (envValue === 'true') {
        return true;
      }
    }
    
    // Default to config or false
    return config.imageGeneration.useMockImages || false;
  });
  
  // Additional UI state
  const [verse, setVerse] = useState(null); // For URL verse parameter
  const [verseToSpeak, setVerseToSpeak] = useState(null);
  const { theme } = useTheme();
  
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
  
  // Add effect to sync mock image state with localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useMockImages', useMockImages);
      
      // For immediate effect without page refresh
      if (useMockImages) {
        window.sessionStorage.setItem('USE_MOCK_IMAGES', 'true');
      } else {
        window.sessionStorage.removeItem('USE_MOCK_IMAGES');
      }
      
      // Force refresh images when mock setting changes
      if (content && content.verses) {
        resetChapterImages();
      }
    }
  }, [useMockImages]);

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

  // Add effect to track visible verses using Intersection Observer
  useEffect(() => {
    if (!content || !content.verses) return;
    
    const options = {
      root: null, // use viewport
      rootMargin: '0px',
      threshold: 1, 
    };

    const handleIntersect = (entries) => {
      const nowVisible = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => parseInt(entry.target.dataset.verse));
      
      if (nowVisible.length > 0) {
        setVisibleVerses(nowVisible);
        
        // If we're not already on this verse, update the current verse
        const middleVisibleIndex = Math.floor(nowVisible.length / 2);
        const centermostVerse = nowVisible[middleVisibleIndex] || nowVisible[0];
        
        // Only update if it would change to avoid unnecessary re-renders
        if (centermostVerse && centermostVerse !== currentVerse) {
          console.log(`Setting current verse to ${centermostVerse} based on scroll`);
          setCurrentVerse(centermostVerse);
        }
      }
    };

    const observer = new IntersectionObserver(handleIntersect, options);
    
    // Observe all verse elements
    Object.keys(versesRef.current).forEach(verseNum => {
      const element = versesRef.current[verseNum];
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [content, versesRef.current, currentVerse]); // Include content.verses and currentVerse in dependencies

  // Load Bible content effect
  useEffect(() => {
    const loadBibleContent = async () => {
      setLoading(true);
      setIsTranslating(false); // Reset translation state
      
      try {
        // First try to load through the API
        try {
          // Add debug logging to track state
          console.log("Starting API fetch...");
          
          const response = await axios.get(`/api/bible-content?book=${book}&chapter=${chapter}&language=${language}`);
          
          console.log("API response received:", response.data);
          if (response.data && response.data.verses) {
            setContent(response.data);
            setCurrentVerse(1);
            if (selectedVerses.length > 0) {
              setSelectedVerses([]);
            }
            setLoading(false); // Only set loading to false when we're done

            // After we have the verses loaded, generate images for the chapter
            if (response.data && response.data.verses && config.imageGeneration.enabled) {
              setLoadingImages(true);
              setLoadedImagesCount(0); // Reset count when starting new image generation
              
              try {
                const imageProvider = config.imageGeneration.provider;
                
                // Set up a function to track image loading progress
                const trackImageProgress = (segments) => {
                  // Count loaded images (ones that aren't in loading state)
                  const loadedCount = segments.filter(s => s && !s.loading).length;
                  setLoadedImagesCount(loadedCount);
                };
                
                // Generate images with progress tracking - pass language parameter
                const images = await generateChapterImages(book, chapter, response.data.verses, imageProvider, language);
                
                // Update loaded images count
                trackImageProgress(images);
                
                // Set up an interval to check progress (useful for parallel loading)
                const progressInterval = setInterval(() => {
                  trackImageProgress(images);
                  // Stop the interval if all images are loaded
                  if (images.every(s => !s.loading)) {
                    clearInterval(progressInterval);
                  }
                }, 500);
                
                setChapterImages(images);
                
                // Set initial image based on current verse
                const initialImage = getImageForVerse(images, currentVerse);
                setCurrentImage(initialImage);
                
                // Clean up interval
                return () => clearInterval(progressInterval);
              } catch (imageError) {
                console.error('Failed to generate chapter images:', imageError);
              } finally {
                setLoadingImages(false);
              }
            }

            return; // Exit early if API call succeeded
          }
        } catch (apiError) {
          console.warn("API fetch failed, falling back to static data:", apiError);
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
            setLoading(false); // Done loading for English
          } else {
            // For non-English, we need to translate
            console.log("Starting translation...");
            setIsTranslating(true); // Set translating state to true BEFORE we start translating
            setLoading(false); // Turn off general loading and show the translation progress
            
            // Get translation service and translate verses with progress callback
            const { translateVerses } = await import('@/services/translationService');
            const translatedVerses = await translateVerses(
              formattedVerses, 
              language, 
              'english', 
              (current, total) => {
                console.log(`Translation progress: ${current}/${total}`);
                setTranslationProgress({ current, total });
              }
            );
            
            setContent({
              book,
              chapter: parseInt(chapter),
              verses: translatedVerses,
              keyScenes
            });
            
            setIsTranslating(false); // Done translating
          }
          
          // Set verse to 1 when changing chapters or language
          setCurrentVerse(1);
          
          // Clear selected verses when language changes
          if (selectedVerses.length > 0) {
            setSelectedVerses([]);
          }

          // After we have the verses loaded, generate images for the chapter
          if (formattedVerses && config.imageGeneration.enabled) {
            setLoadingImages(true);
            setLoadedImagesCount(0); // Reset count when starting new image generation
            
            try {
              const imageProvider = config.imageGeneration.provider;
              
              // Set up a function to track image loading progress
              const trackImageProgress = (segments) => {
                // Count loaded images (ones that aren't in loading state)
                const loadedCount = segments.filter(s => s && !s.loading).length;
                setLoadedImagesCount(loadedCount);
              };
              
              // Generate images with progress tracking - pass language parameter
              const images = await generateChapterImages(book, chapter, formattedVerses, imageProvider, language);
              
              // Update loaded images count
              trackImageProgress(images);
              
              // Set up an interval to check progress (useful for parallel loading)
              const progressInterval = setInterval(() => {
                trackImageProgress(images);
                // Stop the interval if all images are loaded
                if (images.every(s => !s.loading)) {
                  clearInterval(progressInterval);
                }
              }, 500);
              
              setChapterImages(images);
              
              // Set initial image based on current verse
              const initialImage = getImageForVerse(images, currentVerse);
              setCurrentImage(initialImage);
              
              // Clean up interval
              return () => clearInterval(progressInterval);
            } catch (imageError) {
              console.error('Failed to generate chapter images:', imageError);
            } finally {
              setLoadingImages(false);
            }
          }

        } catch (staticError) {
          console.error("Failed to load from static data:", staticError);
          setLoading(false);
          setIsTranslating(false);
        }
      } catch (error) {
        console.error("All Bible content loading methods failed:", error);
        setLoading(false);
        setIsTranslating(false);
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

  // Debug current state to help troubleshoot
  useEffect(() => {
    console.log(`Current state - loading: ${loading}, isTranslating: ${isTranslating}, 
      progress: ${translationProgress.current}/${translationProgress.total}`);
  }, [loading, isTranslating, translationProgress]);

  // Add effect to update current image when verse changes - with enhanced debugging
  useEffect(() => {
    if (chapterImages && chapterImages.length > 0) {
      const matchingImage = getImageForVerse(chapterImages, currentVerse);
      
      // Debug logging to help diagnose the issue
      console.log(`Current verse: ${currentVerse}`);
      console.log(`Available images:`, chapterImages.map(img => 
        `Verses ${img.startVerse}-${img.endVerse}`
      ));
      console.log(`Current image:`, currentImage ? 
        `Verses ${currentImage.startVerse}-${currentImage.endVerse}` : 'None');
      console.log(`Matching image:`, matchingImage ? 
        `Verses ${matchingImage.startVerse}-${matchingImage.endVerse}` : 'None');
        
      if (matchingImage) {
        // Remove currentImage from the condition check to avoid dependency cycles
        setCurrentImage(matchingImage);
        console.log(`Updated image for verse ${currentVerse}: verses ${matchingImage.startVerse}-${matchingImage.endVerse}`);
      }
    }
  }, [currentVerse, chapterImages]); // Remove currentImage from dependency array

  // Handle URL with verse parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verseParam = params.get('verse');
    if (verseParam && !isNaN(parseInt(verseParam))) {
      setVerse(parseInt(verseParam));
      setCurrentVerse(parseInt(verseParam));
    }
  }, []);

  // Add a function to reset the chapter's image cache
  const resetChapterImages = async () => {
    // Clear the cache for this specific chapter
    if (typeof clearImageCache === 'function') {
      clearImageCache(book, chapter);
    }
    
    // Reset local state
    setChapterImages([]);
    setCurrentImage(null);
    setLoadedImagesCount(0);
    
    // Now reload images
    setLoadingImages(true);
    
    try {
      const imageProvider = config.imageGeneration.provider;
      const verses = content?.verses || [];
      
      // Get fresh images - pass language parameter
      const images = await generateChapterImages(book, chapter, verses, imageProvider, language);
      setChapterImages(images);
      
      // Update current image
      const initialImage = getImageForVerse(images, currentVerse);
      setCurrentImage(initialImage);
      setLoadedImagesCount(images.length);
    } catch (error) {
      console.error('Failed to regenerate chapter images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Add a utility function to clear localStorage and image cache
  const clearImageCacheAndPreferences = () => {
    // Clear the localStorage preference
    if (typeof window !== 'undefined') {
      localStorage.removeItem('useMockImages');
      window.sessionStorage.removeItem('USE_MOCK_IMAGES');
    }
    
    // Clear all image cache
    if (typeof clearImageCache === 'function') {
      clearImageCache();
    }
    
    // Reload the page to ensure clean state
    window.location.reload();
  };

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
    // Add minimum height to ensure enough scrollable area
    minHeight: isMobile || viewMode === 'stacked' ? 'calc(100vh - 100px)' : 'auto',
    // Add padding-top for text area to avoid overlap with sticky image
    paddingTop: isMobile || viewMode === 'stacked' ? '0' : '0',
  };

  const textColumnStyle = {
    flex: isMobile || viewMode === 'stacked' ? '1 0 auto' : '0 0 60%',
    width: isMobile || viewMode === 'stacked' ? '100%' : '60%',
    order: isMobile || viewMode === 'stacked' ? 2 : 1,
    // Adjust margin to prevent content overlap with sticky image
    marginTop: isMobile || viewMode === 'stacked' ? 
      (isImageCollapsed ? '90px' : '350px') : // Dynamic top margin based on image state
      0,
  };

  const imageColumnStyle = {
    flex: isMobile || viewMode === 'stacked' ? '1 0 auto' : '0 0 40%',
    width: isMobile || viewMode === 'stacked' ? '100%' : '40%',
    order: isMobile || viewMode === 'stacked' ? 1 : 2,
    marginBottom: isMobile || viewMode === 'stacked' ? '15px' : 0,
    // Fix sticky positioning to show full image
    position: isMobile || viewMode === 'stacked' ? 'sticky' : (viewMode === 'split' ? 'sticky' : 'relative'),
    top: 0, // Changed from 10px to 0 to prevent cutoff
    paddingTop: '10px', // Add padding instead of using 'top' property
    zIndex: 10, // Ensure it stays above other content
    maxHeight: isMobile ? 
      (isImageCollapsed ? '80px' : '100vh') : // Changed from 40vh to 100vh to allow full height
      (viewMode === 'stacked' ? '100vh' : 'calc(100vh - 60px)'),
    transition: 'max-height 0.3s ease-in-out',
    // Change overflow behavior to ensure entire image is visible
    overflowY: 'visible', // Changed from 'auto' to 'visible'
    height: 'auto', // Always auto height
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center the image container
    justifyItems: 'center',
    textAlign: 'center',
    // Add background color to prevent content showing through
    backgroundColor: theme === 'dark' ? '#121212' : '#fff',
    // Add padding to create space between image and text
    paddingBottom: isMobile || viewMode === 'stacked' ? '10px' : '0',
  };

  // Improve the verse click handler to ensure state updates properly
  const handleVerseClick = (verseNumber) => {
    console.log(`Verse clicked: ${verseNumber}`);
    // Force the verse number to be treated as a number
    const verseNum = parseInt(verseNumber);
    setCurrentVerse(verseNum);
    // On mobile, selecting a verse adds/removes it from selection
    if (isMobile) {
      toggleVerseSelection(verseNum);
    }
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
        <div className="translating flex justify-center p-12 w-full" style={{ minHeight: '300px' }}>
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
              {loadingImages ? (
                <BibleImageLoader 
                  book={book}
                  chapter={chapter}
                  totalSegments={config.imageGeneration.maxImagesPerChapter || 2} // Use config value
                  progress={loadedImagesCount}
                />
              ) : (
                <ImageGenerator 
                  currentImageData={currentImage}
                  isLoading={false}
                  fixedHeight={!isMobile && viewMode === 'split'}
                />
              )}
              
              {/* Information about the current scene */}
              {currentImage && !loadingImages && (
                <div className={`p-${isMobile ? '2' : '4'} border-t border-bible-scroll bg-bible-parchment`}>
                  <div className={`mt-${isMobile ? '1' : '2'} ${isMobile ? 'text-xs' : 'text-sm'} text-bible-ink font-biblical`}>
                    <div><span className="font-medium text-bible-royal">Characters:</span> {currentImage.characters}</div>
                    <div><span className="font-medium text-bible-royal">Setting:</span> {currentImage.setting}</div>
                    <div className={`${isMobile ? 'text-2xs' : 'text-xs'} mt-${isMobile ? '1' : '3'} text-bible-ink opacity-70`}>
                      Verses {currentImage.startVerse}-{currentImage.endVerse}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add collapsible button for mobile */}
              {isMobile && (
                <button 
                  onClick={() => setIsImageCollapsed(!isImageCollapsed)}
                  className="w-full text-xs text-bible-royal bg-bible-parchment py-1 rounded-b-md border-b border-bible-scroll"
                >
                  {isImageCollapsed ? "Show full image" : "Collapse image"}
                </button>
              )}
              
              {/* Mobile helper text */}
              {isMobile && (
                <div className="text-xs text-center mt-2 text-gray-500 italic">
                  Swipe left/right to change chapters
                </div>
              )}
            </div>
            
            {/* Developer tools - only shown in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-2 bg-gray-100 border rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">Dev Tools</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs flex items-center gap-1">
                      <input 
                        type="checkbox" 
                        checked={useMockImages}
                        onChange={(e) => setUseMockImages(e.target.checked)}
                      />
                      Use mock images
                    </label>
                    <button
                      onClick={resetChapterImages}
                      className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      Reset Images
                    </button>
                    <button
                      onClick={clearImageCacheAndPreferences}
                      className="text-xs bg-red-200 px-2 py-1 rounded hover:bg-red-300"
                    >
                      Clear All & Reload
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Config limit: {config.imageGeneration.maxImagesPerChapter || 2} images per chapter</p>
                  <p>Env mock setting: {process.env.NEXT_PUBLIC_USE_MOCK_IMAGES || '(not set)'}</p>
                </div>
              </div>
            )}
            
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
                      onClick={() => handleVerseClick(verse.number)}
                      data-verse={verse.number}
                      ref={el => versesRef.current[verse.number] = el}
                    >
                      <div className="flex items-start">
                        {!isMobile && (
                          <input 
                            type="checkbox"
                            checked={selectedVerses.includes(verse.number)}
                            onChange={() => toggleVerseSelection(verse.number)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 mr-2"
                          />
                        )}
                        <div className="flex-grow">
                          <span className={`verse-number ${isMobile ? 'font-bold text-bible-gold' : ''}`}>
                            {verse.number}
                          </span>
                          <span className="verse-text ml-1">{verse.text}</span>
                          {/* Add a button to speak this verse */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerseToSpeak(verse.number);
                            }}
                            title="Listen to this verse"
                            className="ml-2 text-bible-royal hover:text-bible-gold"
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