'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllBooks } from '@/lib/services/mockBibleService';

export default function Home() {
  // Default to Matthew
  const [book, setBook] = useState('Matthew');
  const [chapter, setChapter] = useState(1);
  const [language, setLanguage] = useState('english');
  const [testament, setTestament] = useState('New Testament');
  const [books, setBooks] = useState([]);
  
  const router = useRouter();
  
  useEffect(() => {
    // Load all books from the Bible
    const allBooks = getAllBooks();
    setBooks(allBooks);
  }, []);
  
  // Filter books based on testament selection
  const filteredBooks = books.filter(b => b.testament === testament);
  
  // Get chapter count for selected book
  const selectedBook = books.find(b => b.name === book);
  const chapterCount = selectedBook ? selectedBook.chapters : 28;
  
  const navigateToChapter = () => {
    router.push(`/read?book=${book}&chapter=${chapter}&lang=${language}`);
  };
  
  return (
    <div className="App">
      <header className="bg-blue-700 text-white p-4">
        <h1 className="text-2xl font-bold">StoryTeller</h1>
        <p>Biblical Visual Novel in Nigerian Languages</p>
      </header>
      
      <nav className="bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-4 mb-4">
            <button 
              onClick={() => setTestament('Old Testament')}
              className={`flex-1 py-2 rounded ${testament === 'Old Testament' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              Old Testament
            </button>
            <button 
              onClick={() => setTestament('New Testament')}
              className={`flex-1 py-2 rounded ${testament === 'New Testament' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              New Testament
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <select 
              value={book} 
              onChange={(e) => setBook(e.target.value)}
              className="border rounded px-3 py-1 flex-1"
            >
              {filteredBooks.map((book) => (
                <option key={book.name} value={book.name}>{book.name}</option>
              ))}
            </select>
            
            <select 
              value={chapter} 
              onChange={(e) => setChapter(Number(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {[...Array(chapterCount)].map((_, i) => (
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
        </div>
      </nav>
      
      <main className="container mx-auto my-8 px-4 flex-1">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-semibold mb-4">Experience the Gospel of Matthew</h2>
          <p className="max-w-2xl mx-auto">Our MVP focuses on Matthew's Gospel with culturally relevant imagery in Nigerian context. Explore key stories below.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link href="/read?book=Matthew&chapter=1&lang=english" className="p-6 border bg-blue-50 rounded-lg hover:shadow-lg transition-shadow border-blue-200">
            <h3 className="font-bold text-xl mb-2">Birth of Jesus</h3>
            <p className="text-gray-600">The genealogy and birth narrative in Matthew 1</p>
          </Link>
          
          <Link href="/read?book=Matthew&chapter=5&lang=english" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-xl mb-2">Sermon on the Mount</h3>
            <p className="text-gray-600">Jesus teaches about the Beatitudes in Matthew 5</p>
          </Link>
          
          <Link href="/read?book=Matthew&chapter=14&lang=english" className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-xl mb-2">Feeding the 5000</h3>
            <p className="text-gray-600">Jesus feeds five thousand people in Matthew 14</p>
          </Link>
        </div>
        
      </main>
      
      <footer className="bg-gray-100 p-4 text-center text-gray-600 mt-8">
        <p>StoryTeller &copy; 2023 - Biblical visual novel with AI-generated imagery</p>
      </footer>
    </div>
  );
}
