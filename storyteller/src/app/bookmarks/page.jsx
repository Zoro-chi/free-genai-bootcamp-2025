'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiBookmark, HiX, HiExternalLink, HiPencil, HiTrash, HiCheck } from 'react-icons/hi';
import { config } from '@/lib/config';

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');
  
  // Load bookmarks from localStorage
  useEffect(() => {
    setIsLoading(true);
    const savedBookmarks = localStorage.getItem('storyteller-bookmarks');
    
    if (savedBookmarks) {
      try {
        const parsedBookmarks = JSON.parse(savedBookmarks);
        // Sort by date added (newest first)
        const sortedBookmarks = parsedBookmarks.sort((a, b) => 
          new Date(b.dateAdded) - new Date(a.dateAdded)
        );
        setBookmarks(sortedBookmarks);
      } catch (error) {
        console.error('Failed to parse bookmarks:', error);
        setBookmarks([]);
      }
    } else {
      setBookmarks([]);
    }
    
    setIsLoading(false);
  }, []);
  
  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('storyteller-bookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks, isLoading]);
  
  // Delete bookmark handler
  const deleteBookmark = (id) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };
  
  // Start editing note
  const startEditingNote = (bookmark) => {
    setEditingNoteId(bookmark.id);
    setNoteText(bookmark.note || '');
  };
  
  // Save note
  const saveNote = (id) => {
    setBookmarks(bookmarks.map(bookmark => 
      bookmark.id === id ? { ...bookmark, note: noteText } : bookmark
    ));
    setEditingNoteId(null);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // If bookmarking is disabled in config, don't show the page
  if (!config.features.bookmarking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-biblical text-bible-royal mb-8">Bookmarks</h1>
        <div className="p-8 text-center text-bible-ink bg-white rounded-lg shadow">
          <p>Bookmarking feature is currently disabled.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-biblical text-bible-royal mb-8">Your Bookmarked Verses</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bible-gold"></div>
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="bg-bible-paper rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-bible-scroll divide-opacity-30">
            {bookmarks.map(bookmark => (
              <li key={bookmark.id} className="p-4 hover:bg-bible-parchment bg-opacity-40 transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="bg-bible-royal bg-opacity-10 p-2 rounded-full text-bible-gold">
                      <HiBookmark className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <Link 
                        href={`/read?book=${bookmark.book}&chapter=${bookmark.chapter}&verse=${bookmark.verse}&lang=${bookmark.language}`}
                        className="font-medium text-bible-royal hover:underline flex items-center"
                      >
                        {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                        <HiExternalLink className="ml-1 w-3 h-3" />
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(bookmark.dateAdded)} • {bookmark.language.charAt(0).toUpperCase() + bookmark.language.slice(1)}
                      </div>
                      
                      {/* Note display and edit */}
                      {editingNoteId === bookmark.id ? (
                        <div className="mt-2">
                          <textarea
                            className="w-full p-2 border border-bible-scroll rounded-md text-sm focus:ring-bible-royal focus:border-bible-royal"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note about this verse..."
                            rows={3}
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveNote(bookmark.id)}
                              className="text-bible-royal hover:text-bible-royal/80 flex items-center"
                            >
                              <HiCheck className="w-4 h-4 mr-1" />
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {bookmark.note ? (
                            <div className="mt-2 text-bible-ink text-sm p-2 bg-bible-parchment bg-opacity-50 rounded-md">
                              <p className="italic">"{bookmark.note}"</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingNote(bookmark)}
                              className="mt-2 text-xs text-gray-500 hover:text-bible-royal flex items-center"
                            >
                              <HiPencil className="w-3 h-3 mr-1" />
                              Add note
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!editingNoteId && bookmark.note && (
                      <button
                        onClick={() => startEditingNote(bookmark)}
                        className="text-gray-400 hover:text-bible-royal"
                        aria-label="Edit note"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label="Delete bookmark"
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="p-4 bg-bible-paper border-t border-bible-scroll">
            <button
              onClick={() => setBookmarks([])}
              className="px-4 py-2 text-red-500 border border-red-500 rounded-md hover:bg-red-50 text-sm"
            >
              Clear All Bookmarks
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-bible-ink bg-white rounded-lg shadow">
          <div className="flex justify-center mb-4">
            <HiBookmark className="w-12 h-12 text-bible-gold opacity-30" />
          </div>
          <h2 className="text-xl font-biblical mb-2">No Bookmarks Yet</h2>
          <p className="mb-6">You haven't bookmarked any verses yet.</p>
          <Link 
            href="/read" 
            className="px-5 py-2 bg-bible-royal text-white rounded-md hover:bg-bible-royal/80"
          >
            Start Reading
          </Link>
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
