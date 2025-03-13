'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BibleChapterViewer from '@/components/BibleChapterViewer';

export default function ReadPage() {
  const searchParams = useSearchParams();
  const book = searchParams.get('book') || 'John';
  const chapter = parseInt(searchParams.get('chapter')) || 1;
  const lang = searchParams.get('lang') || 'english';
  
  return (
    <div className="App">
      <header className="bg-blue-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">StoryTeller</Link>
          <div className="text-sm">Reading: {book} {chapter}</div>
        </div>
      </header>
      
      <main className="container mx-auto my-8 px-4">
        <BibleChapterViewer 
          book={book}
          chapter={chapter}
          language={lang}
        />
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 mt-8">
        <p>StoryTeller &copy; 2023 - A biblical visual novel with AI-generated imagery</p>
      </footer>
    </div>
  );
}
