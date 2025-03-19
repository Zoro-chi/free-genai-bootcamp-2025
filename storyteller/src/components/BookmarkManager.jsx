'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiBookmark, HiOutlineBookmark, HiX, HiExternalLink } from 'react-icons/hi';
import { config } from '@/lib/config';

const BookmarkManager = ({ 
  currentBook,
  currentChapter,
  currentVerse,
  language,
  isMobile = false
}) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const router = useRouter();
  
  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('storyteller-bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (error) {
        console.error('Failed to parse bookmarks:', error);
      }
    }
  }, []);
  
  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('storyteller-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);
  
  // Check if current verse is bookmarked
  const isCurrentVerseBookmarked = () => {
    return bookmarks.some(
      b => b.book === currentBook &&
      b.chapter === parseInt(currentChapter) &&
      b.verse === currentVerse &&
      b.language === language
    );
  };
  
  // Toggle bookmark for current verse
  const toggleBookmark = () => {
    if (isCurrentVerseBookmarked()) {
      removeBookmark();
    } else {
      addBookmark();
    }
  };
  
  // Add current verse to bookmarks
  const addBookmark = () => {
    const newBookmark = {
      id: `${Date.now()}`,
      book: currentBook,
      chapter: parseInt(currentChapter),
      verse: currentVerse,
      language,
      dateAdded: new Date().toISOString(),
      note: '' // Optional user note
    };
    
    setBookmarks([...bookmarks, newBookmark]);
  };
  
  // Remove bookmark for current verse
  const removeBookmark = () => {
    setBookmarks(bookmarks.filter(
      b => !(b.book === currentBook &&
        b.chapter === parseInt(currentChapter) &&
        b.verse === currentVerse &&
        b.language === language)
    ));
  };
  
  // Delete a bookmark by ID
  const deleteBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };
  
  // Navigate to a bookmarked verse
  const navigateToBookmark = (bookmark) => {
    router.push(`/read?book=${bookmark.book}&chapter=${bookmark.chapter}&verse=${bookmark.verse}&lang=${bookmark.language}`);
    setShowBookmarks(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // If bookmarking is disabled in config, don't render
  if (!config.features.bookmarking) {
    return null;
  }
  
  return (
    <>
      {/* Bookmark toggle button */}
      <button
        onClick={toggleBookmark}
        className={`bookmark-btn p-2 rounded-full transition ${
          isCurrentVerseBookmarked() 
            ? 'text-bible-gold bg-bible-royal bg-opacity-20' 
            : 'text-bible-royal'
        }`}
        aria-label={isCurrentVerseBookmarked() ? 'Remove bookmark' : 'Add bookmark'}
        title={isCurrentVerseBookmarked() ? 'Remove bookmark' : 'Add bookmark'}
      >
        {isCurrentVerseBookmarked() ? (
          <HiBookmark className="w-5 h-5" />
        ) : (
          <HiOutlineBookmark className="w-5 h-5" />
        )}
      </button>
      
      {/* Show bookmarks button (only if there are bookmarks) */}
      {bookmarks.length > 0 && (
        <button
          onClick={() => setShowBookmarks(true)}
          className="bookmarks-list-btn p-2 text-sm flex items-center gap-1 text-bible-royal rounded hover:bg-bible-parchment transition"
          aria-label="View bookmarks"
          title="View bookmarks"
        >
          <HiBookmark className="w-4 h-4" />
          {!isMobile && <span>{bookmarks.length} Bookmarks</span>}
        </button>
      )}
      
      {/* Bookmarks panel */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`bg-bible-paper rounded-lg shadow-xl overflow-hidden ${isMobile ? 'w-full' : 'max-w-2xl w-full'}`}>
            <div className="flex justify-between items-center p-4 border-b border-bible-scroll bg-bible-parchment">
              <h3 className="font-biblical text-bible-royal font-bold">
                Your Bookmarks ({bookmarks.length})
              </h3>
              <button 
                onClick={() => setShowBookmarks(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh]">
              {bookmarks.length > 0 ? (
                <ul className="divide-y divide-bible-scroll divide-opacity-20">
                  {bookmarks.map((bookmark) => (
                    <li key={bookmark.id} className="p-3 hover:bg-bible-parchment bg-opacity-50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div 
                            onClick={() => navigateToBookmark(bookmark)}
                            className="font-medium text-bible-royal hover:underline cursor-pointer flex items-center"
                          >
                            {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                            <HiExternalLink className="ml-1 w-3 h-3" />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(bookmark.dateAdded)} • {bookmark.language.charAt(0).toUpperCase() + bookmark.language.slice(1)}
                          </div>
                          {bookmark.note && (
                            <div className="text-sm mt-2 italic">"{bookmark.note}"</div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteBookmark(bookmark.id)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Delete bookmark"
                        >
                          <HiX className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>You have no bookmarks yet.</p>
                  <p className="mt-2 text-sm">Add bookmarks by clicking the bookmark icon next to a verse.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-bible-scroll bg-gray-50 flex justify-between">
              <button
                onClick={() => setBookmarks([])}
                className="px-4 py-2 text-red-500 rounded-md hover:bg-red-50"
                disabled={bookmarks.length === 0}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowBookmarks(false)}
                className="px-4 py-2 bg-bible-royal text-white rounded-md hover:bg-bible-royal/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookmarkManager;
