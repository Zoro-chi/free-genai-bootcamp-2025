'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllBooks } from '@/lib/services/mockBibleService';

const BibleNavigation = ({ currentBook, currentChapter }) => {
  const [books, setBooks] = useState([]);
  const [testament, setTestament] = useState('New Testament');
  
  useEffect(() => {
    // Remove async since getAllBooks is synchronous
    const loadBooks = () => {
      try {
        const allBooks = getAllBooks();
        setBooks(allBooks);
      } catch (error) {
        console.error("Error loading books:", error);
        setBooks([]);
      }
    };
    
    loadBooks();
  }, []);
  
  // Get list of books for current testament
  const filteredBooks = books.filter(book => book.testament === testament);
  
  // Get current book info
  const bookInfo = books.find(b => b.name === currentBook) || { chapters: 0 };
  
  // Create array of chapter numbers for the current book
  const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);
  
  return (
    <div className="bible-navigation">
      <div className="flex gap-4 items-center mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-500 mb-1">Testament</label>
          <div className="flex">
            <button 
              className={`px-3 py-1 text-sm rounded-l border ${testament === 'Old Testament' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setTestament('Old Testament')}
            >
              Old
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-r border-t border-r border-b ${testament === 'New Testament' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setTestament('New Testament')}
            >
              New
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          <label htmlFor="book-select" className="block text-sm font-medium text-gray-500 mb-1">Book</label>
          <select 
            id="book-select"
            className="w-full rounded border px-2 py-1 text-sm"
            value={currentBook}
            onChange={(e) => {
              // Reset to chapter 1 when book changes
              const book = e.target.value;
              window.location.href = `/read?book=${book}&chapter=1`;
            }}
          >
            {filteredBooks.map((book) => (
              <option key={book.name} value={book.name}>
                {book.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="chapter-select" className="block text-sm font-medium text-gray-500 mb-1">Chapter</label>
          <select
            id="chapter-select"
            className="w-full rounded border px-2 py-1 text-sm" 
            value={currentChapter}
            onChange={(e) => {
              const chapter = e.target.value;
              window.location.href = `/read?book=${currentBook}&chapter=${chapter}`;
            }}
          >
            {chapters.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <Link
          href={`/read?book=${currentBook}&chapter=${Math.max(1, currentChapter - 1)}`}
          className={`px-3 py-1 rounded text-sm ${currentChapter <= 1 ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-800'}`}
          aria-disabled={currentChapter <= 1}
        >
          Previous Chapter
        </Link>
        
        <Link
          href={`/read?book=${currentBook}&chapter=${currentChapter + 1}`}
          className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm"
        >
          Next Chapter
        </Link>
      </div>
    </div>
  );
};

// Make sure the component is exported properly
export default BibleNavigation;
