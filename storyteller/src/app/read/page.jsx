'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BibleChapterViewer from '@/components/BibleChapterViewer';
import { useState, useEffect } from 'react';
import { getBookInfo } from '@/lib/services/mockBibleService';

export default function ReadPage() {
  const searchParams = useSearchParams();
  const book = searchParams.get('book') || 'Matthew';
  const chapter = parseInt(searchParams.get('chapter')) || 1;
  const lang = searchParams.get('lang') || 'english';
  
  // State to track if a book/chapter is valid
  const [isValid, setIsValid] = useState(true);
  const [bookInfo, setBookInfo] = useState(null);
  
  useEffect(() => {
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
    <div className="App">
      <header className="bg-blue-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">StoryTeller</Link>
          <div className="text-sm">
            Reading: {book} {chapter}
          </div>
        </div>
      </header>
      
      <main className="container mx-auto my-8 px-4 max-w-6xl">
        {!isValid ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Invalid Book or Chapter
            </h2>
            <p className="mb-4">
              {!bookInfo ? 
                `The book "${book}" was not found.` : 
                `Chapter ${chapter} is not valid for ${book}, which has ${bookInfo.chapters} chapters.`
              }
            </p>
            <Link 
              href="/" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
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
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 mt-8">
        <p>StoryTeller &copy; 2023 - Biblical visual novel with AI-generated imagery</p>
      </footer>
    </div>
  );
}
