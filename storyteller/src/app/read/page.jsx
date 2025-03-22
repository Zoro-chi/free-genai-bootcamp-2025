'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { useState, useEffect } from 'react';
import { getBookInfo } from '@/lib/services/mockBibleService';

export default function ReadPage() {
  const searchParams = useSearchParams();
  // Make sure to decode the book name from the URL
  const book = searchParams.get('book') ? decodeURIComponent(searchParams.get('book')) : 'Matthew';
  const chapter = parseInt(searchParams.get('chapter')) || 1;
  const lang = searchParams.get('lang') || 'english';
  
  // State to track if a book/chapter is valid
  const [isValid, setIsValid] = useState(true);
  const [bookInfo, setBookInfo] = useState(null);
  
  useEffect(() => {
    // Add debug log to verify the book name
    console.log("Reading book:", book, "chapter:", chapter);
    
    // Validate that the requested book and chapter exist
    const info = getBookInfo(book);
    setBookInfo(info);
    
    if (!info) {
      setIsValid(false);
      return;
    }
    
    // Check if chapter is in valid range
    if (chapter < 1 || chapter > info.chapters) {
      setIsValid(false);
    } else {
      setIsValid(true);
    }
  }, [book, chapter]);
  
  // Check for layout preference in URL or localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('bibleViewMode');
    if (savedViewMode) {
      // We could pass this to BibleChapterViewer as a prop if needed
      // For now, the component handles its own state
    }
  }, []);
  
  return (
    <div className="App min-h-screen">
      {/* Header is now in layout.jsx */}
      
      <main className="container mx-auto my-8 px-4 max-w-6xl">
        {!isValid ? (
          <div className="bible-paper text-center py-12 mt-8">
            <h2 className="text-3xl font-bold text-bible-crimson mb-6 font-biblical">
              Invalid Book or Chapter
            </h2>
            <p className="mb-6 text-bible-ink font-biblical text-lg">
              {!bookInfo ? 
                `The book "${book}" was not found.` : 
                `Chapter ${chapter} is not valid for ${book}, which has ${bookInfo.chapters} chapters.`
              }
            </p>
            <Link 
              href="/" 
              className="biblical-btn bg-bible-royal text-white px-6 py-3 inline-block rounded-md font-biblical"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <BibleChapterViewer 
            book={book}
            chapter={chapter}
            language={lang}
          />
        )}
      </main>
    </div>
  );
}
