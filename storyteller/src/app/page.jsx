'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [language, setLanguage] = useState('english');
  const router = useRouter();
  
  const navigateToChapter = () => {
    router.push(`/read?book=${book}&chapter=${chapter}&lang=${language}`);
  };
  
  return (
    <div className="App">
      <header className="bg-blue-700 text-white p-4">
        <h1 className="text-2xl font-bold">StoryTeller</h1>
        <p>New Testament Visual Novel in Nigerian Languages</p>
      </header>
      
      <nav className="bg-gray-100 p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <select 
            value={book} 
            onChange={(e) => setBook(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="Matthew">Matthew</option>
            <option value="Mark">Mark</option>
            <option value="Luke">Luke</option>
            <option value="John">John</option>
            <option value="Acts">Acts</option>
          </select>
          
          <select 
            value={chapter} 
            onChange={(e) => setChapter(Number(e.target.value))}
            className="border rounded px-3 py-1"
          >
            {[...Array(30)].map((_, i) => (
              <option key={i+1} value={i+1}>Chapter {i+1}</option>
            ))}
          </select>
          
          <button 
            onClick={navigateToChapter}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Read Now
          </button>
        </div>
      </nav>
      
      <main className="container mx-auto my-8 px-4 flex-1">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-semibold mb-4">Experience the Bible in a New Way</h2>
          <p className="max-w-2xl mx-auto">StoryTeller brings biblical narratives to life through culturally relevant imagery and interactive storytelling. Choose a book to begin your journey.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/read?book=Matthew&chapter=5&lang=english" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-xl mb-2">Sermon on the Mount</h3>
            <p className="text-gray-600">Jesus teaches about the Beatitudes in Matthew 5</p>
          </Link>
          
          <Link href="/read?book=Mark&chapter=6&lang=english" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-xl mb-2">Feeding the 5000</h3>
            <p className="text-gray-600">Jesus performs a miracle with loaves and fish</p>
          </Link>
          
          <Link href="/read?book=John&chapter=1&lang=english" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-xl mb-2">The Word Becomes Flesh</h3>
            <p className="text-gray-600">John's account of creation and Jesus' divinity</p>
          </Link>
        </div>
        
        <div className="mt-10 text-center">
          <Link href="/test-prompts" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Test Prompt Templates
          </Link>
        </div>
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 mt-8">
        <p>StoryTeller &copy; 2023 - A biblical visual novel with AI-generated imagery</p>
      </footer>
    </div>
  );
}
