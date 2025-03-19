'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';

const BibleNavigation = ({ 
  currentBook = 'Matthew',
  currentChapter = 1, 
  language = 'english',
  isMobile = false,
  onLanguageChange = () => {}
}) => {
  const router = useRouter();
  const [books, setBooks] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  
  useEffect(() => {
    // Fetch books in selected language
    const fetchBooks = async () => {
      try {
        setLoadingBooks(true);
        // This would be a real API call in production
        // For now we'll use a mock response
        
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - in production this would be fetched from API
        const mockBooks = {
          'Genesis': { chapters: 50 },
          'Exodus': { chapters: 40 },
          'Leviticus': { chapters: 27 },
          // ... other Old Testament books
          'Matthew': { chapters: 28 },
          'Mark': { chapters: 16 },
          'Luke': { chapters: 24 },
          'John': { chapters: 21 },
          'Acts': { chapters: 28 },
          // ... other New Testament books
          'Revelation': { chapters: 22 }
        };
        
        setBooks(mockBooks);
      } catch (error) {
        console.error("Failed to fetch Bible books:", error);
      } finally {
        setLoadingBooks(false);
      }
    };
    
    fetchBooks();
  }, [language]);
  
  // Generate array of available chapters for the current book
  const availableChapters = [];
  if (books && books[currentBook]) {
    for (let i = 1; i <= books[currentBook].chapters; i++) {
      availableChapters.push(i);
    }
  }
  
  const handleBookChange = (e) => {
    const newBook = e.target.value;
    router.push(`/read?book=${newBook}&chapter=1&lang=${language}`);
  };
  
  const handleChapterChange = (e) => {
    const newChapter = e.target.value;
    router.push(`/read?book=${currentBook}&chapter=${newChapter}&lang=${language}`);
  };
  
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value.toLowerCase();
    onLanguageChange(newLanguage);
  };
  
  return (
    <div className={`bible-navigation ${isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-4'}`}>
      {loadingBooks ? (
        <div className="loading text-sm text-bible-royal">Loading books...</div>
      ) : (
        <>
          {/* Book selection */}
          <div className={`book-select ${isMobile ? 'w-full' : 'flex-grow'}`}>
            <select 
              value={currentBook} 
              onChange={handleBookChange}
              className={`w-full p-2 rounded-md border border-bible-scroll focus:outline-none focus:ring-1 focus:ring-bible-royal
                ${isMobile ? 'text-sm' : 'text-base'}`}
              aria-label="Select book"
            >
              {books && Object.keys(books).map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
          </div>
          
          {/* Chapter selection */}
          <div className={`chapter-select ${isMobile ? 'w-full' : 'w-24'}`}>
            <select 
              value={currentChapter} 
              onChange={handleChapterChange}
              className={`w-full p-2 rounded-md border border-bible-scroll focus:outline-none focus:ring-1 focus:ring-bible-royal
                ${isMobile ? 'text-sm' : 'text-base'}`}
              aria-label="Select chapter"
            >
              {availableChapters.map(chapter => (
                <option key={chapter} value={chapter}>
                  Chapter {chapter}
                </option>
              ))}
            </select>
          </div>
          
          {/* Language selector */}
          <div className={`language-select ${isMobile ? 'w-full mt-1' : 'w-32'}`}>
            <select 
              value={language} 
              onChange={handleLanguageChange}
              className={`w-full p-2 rounded-md border border-bible-scroll bg-bible-parchment focus:outline-none focus:ring-1 focus:ring-bible-royal
                ${isMobile ? 'text-sm' : 'text-base'}`}
              aria-label="Select language"
            >
              {config.languages.available.map(lang => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default BibleNavigation;
