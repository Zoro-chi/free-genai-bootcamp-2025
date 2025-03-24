'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllBooks } from '@/services/mockBibleService';
import BibleNavigation from '@/components/BibleNavigation';

export default function Home() {
  // Default to Matthew
  const [book, setBook] = useState('Matthew');
  const [chapter, setChapter] = useState(1);
  const [language, setLanguage] = useState('english');
  
  const router = useRouter();
  
  const navigateToChapter = () => {
    router.push(`/read?book=${book}&chapter=${chapter}&lang=${language}`);
  };
  
  // Custom handler for BibleNavigation component 
  const handleBookChapterChange = (newBook, newChapter) => {
    setBook(newBook);
    setChapter(newChapter);
  };
  
  return (
    <div className="App min-h-screen">
      <nav className="bg-white bg-opacity-80 p-6 shadow-md border-t-4 border-bible-gold">
        <div className="max-w-4xl mx-auto">
          {/* Replace custom navigation with BibleNavigation component */}
          <BibleNavigation 
            currentBook={book}
            currentChapter={chapter}
            language={language}
            onLanguageChange={(newLang) => setLanguage(newLang)}
            onBookChapterChange={handleBookChapterChange}
            hideNavButtons={true} // Hide prev/next buttons on home page
          />
          
          {/* Add a prominent Read Now button with guaranteed centering */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginTop: '2rem'
          }}>
            <button 
              onClick={navigateToChapter}
              className="biblical-btn bg-bible-royal text-white hover:bg-bible-gold hover:text-bible-ink transition-all text-lg"
              style={{
                padding: '1rem 2rem',
                borderRadius: '0.375rem',
                minWidth: '200px',
                textAlign: 'center',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              Read Now
            </button>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto my-12 px-4 flex-1">
        {/* Section title with decorative elements */}
        <div className="text-center mb-12" style={{ textAlign: 'center' }}>
          <div className="chapter-divider">
            <span className="mx-4 text-bible-gold text-xl">✦</span>
          </div>
          <h2 className="text-4xl font-bold font-biblical mb-4 text-bible-royal" style={{ textAlign: 'center' }}>Experience the Gospel of Matthew</h2>
          <p className="max-w-2xl mx-auto font-biblical text-lg text-bible-ink leading-relaxed" style={{ textAlign: 'center' }}>
            Our MVP focuses on Matthew's Gospel with culturally relevant imagery in Nigerian context. Explore key stories below.
          </p>
          <div className="chapter-divider">
            <span className="mx-4 text-bible-gold text-xl">✦</span>
          </div>
        </div>
        
        {/* Featured stories grid with improved styling and guaranteed centered text */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Story Card 1 */}
          <div className="story-card transition-all duration-300 hover:transform hover:translate-y-[-5px]">
            <Link href="/read?book=Matthew&chapter=1&lang=english" 
                className="block h-full bg-white rounded-lg overflow-hidden shadow-md border border-bible-scroll hover:shadow-xl">
              <div className="border-l-4 border-bible-gold h-full flex flex-col">
                <div className="p-6 flex-grow" style={{ textAlign: 'center' }}>
                  <h3 className="font-bold text-2xl mb-3 text-bible-royal font-biblical" style={{ textAlign: 'center' }}>Birth of Jesus</h3>
                  <p className="text-bible-ink font-biblical leading-relaxed" style={{ textAlign: 'center' }}>The genealogy and birth narrative in Matthew 1</p>
                </div>
                <div className="bg-bible-parchment bg-opacity-50 p-4" style={{ textAlign: 'center' }}>
                  <span className="text-sm font-biblical text-bible-royal">Matthew 1</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Story Card 2 */}
          <div className="story-card transition-all duration-300 hover:transform hover:translate-y-[-5px]">
            <Link href="/read?book=Matthew&chapter=5&lang=english" 
                className="block h-full bg-white rounded-lg overflow-hidden shadow-md border border-bible-scroll hover:shadow-xl">
              <div className="border-l-4 border-bible-gold h-full flex flex-col">
                <div className="p-6 flex-grow" style={{ textAlign: 'center' }}>
                  <h3 className="font-bold text-2xl mb-3 text-bible-royal font-biblical" style={{ textAlign: 'center' }}>Sermon on the Mount</h3>
                  <p className="text-bible-ink font-biblical leading-relaxed" style={{ textAlign: 'center' }}>Jesus teaches about the Beatitudes in Matthew 5</p>
                </div>
                <div className="bg-bible-parchment bg-opacity-50 p-4" style={{ textAlign: 'center' }}>
                  <span className="text-sm font-biblical text-bible-royal">Matthew 5</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Story Card 3 */}
          <div className="story-card transition-all duration-300 hover:transform hover:translate-y-[-5px]">
            <Link href="/read?book=Matthew&chapter=14&lang=english" 
                className="block h-full bg-white rounded-lg overflow-hidden shadow-md border border-bible-scroll hover:shadow-xl">
              <div className="border-l-4 border-bible-gold h-full flex flex-col">
                <div className="p-6 flex-grow" style={{ textAlign: 'center' }}>
                  <h3 className="font-bold text-2xl mb-3 text-bible-royal font-biblical" style={{ textAlign: 'center' }}>Feeding the 5000</h3>
                  <p className="text-bible-ink font-biblical leading-relaxed" style={{ textAlign: 'center' }}>Jesus feeds five thousand people in Matthew 14</p>
                </div>
                <div className="bg-bible-parchment bg-opacity-50 p-4" style={{ textAlign: 'center' }}>
                  <span className="text-sm font-biblical text-bible-royal">Matthew 14</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Additional imagery section */}
        <div className="mt-16" style={{ textAlign: 'center' }}>
          <div className="inline-block mb-6 px-8 py-3 bg-bible-royal bg-opacity-10 rounded-full">
            <p className="text-bible-royal font-biblical" style={{ textAlign: 'center' }}>More chapters coming soon</p>
          </div>
          
          <div className="chapter-divider">
            <span className="mx-4 text-bible-scroll">✦</span>
          </div>
        </div>
      </main>
    </div>
  );
}
