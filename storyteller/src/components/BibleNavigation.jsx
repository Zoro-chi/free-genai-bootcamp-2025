"use client";

import { useEffect, useState } from "react";
import { getAllBooks } from "@/lib/services/mockBibleService";
import { HiChevronLeft, HiChevronRight, HiOutlineBookOpen } from "react-icons/hi";

const BibleNavigation = ({ 
  currentBook, 
  currentChapter, 
  language, 
  onLanguageChange,
  // Add new props for flexibility
  onBookChapterChange = null,
  hideNavButtons = false
}) => {
  const [books, setBooks] = useState([]);
  const [testament, setTestament] = useState("New Testament");
  const [changingLanguage, setChangingLanguage] = useState(false);

  useEffect(() => {
    const loadBooks = () => {
      try {
        const allBooks = getAllBooks();
        setBooks(allBooks);

        // Set testament based on current book
        const currentBookObj = allBooks.find((b) => b.name === currentBook);
        if (currentBookObj) {
          setTestament(currentBookObj.testament);
        }
      } catch (error) {
        console.error("Error loading books:", error);
        setBooks([]);
      }
    };

    loadBooks();
  }, [currentBook]);

  // Get list of books for current testament
  const filteredBooks = books.filter((book) => book.testament === testament);

  // Get current book info
  const bookInfo = books.find((b) => b.name === currentBook) || { chapters: 0 };

  // Create array of chapter numbers for the current book
  const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);

  // Enhanced navigation function for both direct navigation and parent state updates
  const handleBookChapterChange = (book, chapter) => {
    // If parent provided a change handler, call it
    if (onBookChapterChange) {
      onBookChapterChange(book, chapter);
    } else {
      // Otherwise navigate directly
      window.location.href = `/read?book=${book}&chapter=${chapter}`;
    }
  };

  // Enhanced language change handler
  const handleLanguageChange = (newLanguage) => {
    if (newLanguage !== language) {
      setChangingLanguage(true);
      // Call the parent's language change handler
      onLanguageChange(newLanguage);
      // Reset the changing state after a short delay
      setTimeout(() => setChangingLanguage(false), 500);
    }
  };

  // Determine if previous/next buttons should be disabled
  const isPrevDisabled = currentChapter <= 1;
  const isNextDisabled = currentChapter >= bookInfo.chapters;

  // Apply inline styles for guaranteed flex layout and text centering
  const containerStyle = {
    width: '100%',
    maxWidth: '100%',
    textAlign: 'center'
  };
  
  const testamentRowStyle = {
    display: 'flex', 
    justifyContent: 'center',
    marginBottom: '2rem',
    textAlign: 'center'
  };
  
  const selectorsRowStyle = {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: '1rem',
    marginBottom: '2rem',
    width: '100%',
    textAlign: 'center'
  };
  
  const selectorColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 0, // Prevent overflow on small screens
    gap: '0.5rem',
    textAlign: 'center'
  };

  const navigationRowStyle = {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--scroll-brown)',
    marginBottom: '4rem',
    textAlign: 'center'
  };

  const labelStyle = {
    textAlign: 'center',
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  };

  return (
    <div className="bible-navigation" style={containerStyle}>
      <div className="bg-bible-parchment rounded-lg p-6 border border-bible-scroll" style={{ textAlign: 'center' }}>
        {/* Row 1: Testament selector - centered with increased margin between buttons */}
        <div style={testamentRowStyle}>
          <div className="inline-flex gap-8" style={{ textAlign: 'center' }}>
            <button
              className={`px-8 py-3 text-base rounded-lg border-2 font-biblical transition-colors min-w-[160px] ${
                testament === "Old Testament"
                  ? "bg-bible-royal text-white border-bible-royal"
                  : "bg-white text-bible-ink border-bible-scroll hover:bg-bible-scroll hover:bg-opacity-10"
              }`}
              onClick={() => setTestament("Old Testament")}
              style={{ textAlign: 'center' }}
            >
              Old Testament
            </button>
            <button
              className={`px-8 py-3 text-base rounded-lg border-2 font-biblical transition-colors min-w-[160px] ${
                testament === "New Testament"
                  ? "bg-bible-royal text-white border-bible-royal"
                  : "bg-white text-bible-ink border-bible-scroll hover:bg-bible-scroll hover:bg-opacity-10"
              }`}
              onClick={() => setTestament("New Testament")}
              style={{ textAlign: 'center' }}
            >
              New Testament
            </button>
          </div>
        </div>

        {/* Row 2: Book, Chapter and Language selectors in a single row with forced flex-row */}
        <div style={selectorsRowStyle}>
          {/* Book selector */}
          <div style={selectorColumnStyle}>
            <label
              htmlFor="book-select"
              className="block text-bible-royal font-bold mb-2 font-biblical"
              style={labelStyle}
            >
              Book
            </label>
            <select
              id="book-select"
              className="biblical-select w-full font-biblical text-center"
              value={currentBook}
              onChange={(e) => handleBookChapterChange(e.target.value, 1)}
              style={{ textAlign: 'center', textAlignLast: 'center' }}
            >
              {filteredBooks.map((book) => (
                <option key={book.name} value={book.name}>
                  {book.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter selector */}
          <div style={selectorColumnStyle}>
            <label
              htmlFor="chapter-select"
              className="block text-bible-royal font-bold mb-2 font-biblical text-center"
              style={labelStyle}
            >
              Chapter
            </label>
            <select
              id="chapter-select"
              className="biblical-select w-full font-biblical"
              value={currentChapter}
              onChange={(e) => handleBookChapterChange(currentBook, e.target.value)}
              style={{ textAlign: 'center', textAlignLast: 'center' }}
            >
              {chapters.map((num) => (
                <option key={num} value={num}>
                  Chapter {num}
                </option>
              ))}
            </select>
          </div>
          
          {/* Language selector */}
          <div style={selectorColumnStyle}>
            <label 
              htmlFor="language-select"
              className="block text-bible-royal font-bold mb-2 font-biblical text-center"
              style={labelStyle}
            >
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`biblical-select w-full font-biblical ${changingLanguage ? 'opacity-50' : ''}`}
              disabled={changingLanguage}
              style={{ textAlign: 'center', textAlignLast: 'center' }}
            >
              <option value="english">English</option>
              <option value="yoruba">Yoruba</option>
              <option value="igbo">Igbo</option>
              <option value="pidgin">Nigerian Pidgin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 3: Previous/Next navigation buttons - conditionally rendered */}
      {!hideNavButtons && (
        <div style={navigationRowStyle}>
          <button
            onClick={() => !isPrevDisabled && handleBookChapterChange(currentBook, currentChapter - 1)}
            className={`biblical-btn flex items-center gap-2 ${
              isPrevDisabled
                ? "opacity-50 cursor-not-allowed bg-gray-200"
                : "hover:bg-bible-gold"
            }`}
            disabled={isPrevDisabled}
            aria-label="Previous Chapter"
          >
            <HiChevronLeft className="w-5 h-5" />
            <span className="font-biblical">Previous Chapter</span>
          </button>

          <div className="flex items-center text-bible-royal bg-bible-parchment px-6 py-2 rounded-full border border-bible-scroll">
            <HiOutlineBookOpen className="w-6 h-6 mr-2 text-bible-gold" />
            <span className="font-biblical text-lg">{currentBook} {currentChapter}</span>
          </div>

          <button
            onClick={() => !isNextDisabled && handleBookChapterChange(currentBook, currentChapter + 1)}
            className={`biblical-btn flex items-center gap-2 ${
              isNextDisabled
                ? "opacity-50 cursor-not-allowed bg-gray-200"
                : "hover:bg-bible-gold"
            }`}
            disabled={isNextDisabled}
            aria-label="Next Chapter"
          >
            <span className="font-biblical">Next Chapter</span>
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default BibleNavigation;
