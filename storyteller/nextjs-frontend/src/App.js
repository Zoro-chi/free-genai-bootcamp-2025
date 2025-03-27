import React, { useState } from 'react';
import BibleChapterViewer from './components/BibleChapterViewer';
import './App.css';

function App() {
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState(1);
  const [language, setLanguage] = useState('english');
  
  // Get URL parameters if present
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('book')) setBook(params.get('book'));
    if (params.get('chapter')) setChapter(Number(params.get('chapter')));
    if (params.get('lang')) setLanguage(params.get('lang'));
  }, []);
  
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
            {/* Add other New Testament books */}
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
            onClick={() => {
              window.location.search = `?book=${book}&chapter=${chapter}&lang=${language}`;
            }}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Go
          </button>
        </div>
      </nav>
      
      <main className="container mx-auto my-8 px-4">
        <BibleChapterViewer 
          book={book}
          chapter={chapter}
          language={language}
        />
      </main>
    </div>
  );
}

export default App;
