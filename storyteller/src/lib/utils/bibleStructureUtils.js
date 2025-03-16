/**
 * Utility functions to handle different Bible JSON structures
 */

/**
 * Analyzes the structure of a Bible JSON to determine its format
 * @param {Object|Array} bibleData - The imported Bible data
 * @returns {String} - The determined format type ('array', 'object', 'nested', 'unknown')
 */
export function analyzeBibleStructure(bibleData) {
  if (!bibleData) return 'unknown';
  
  if (Array.isArray(bibleData)) {
    return 'array'; // Format where Bible is an array of book objects
  }
  
  if (typeof bibleData === 'object') {
    // Check if it's an object with book names as keys
    const firstBookKey = Object.keys(bibleData)[0];
    if (!firstBookKey) return 'unknown';
    
    const firstBook = bibleData[firstBookKey];
    
    if (typeof firstBook === 'object') {
      // Check if it's book -> chapter -> verses structure
      if (firstBook['1'] || firstBook.chapters) {
        return 'nested'; // Format where Bible is {book: {chapter: verses}}
      }
      return 'object'; // Format where Bible is {book: bookData}
    }
  }
  
  return 'unknown';
}

/**
 * Get a list of books from a Bible object regardless of its structure
 * @param {Object|Array} bibleData - The imported Bible data
 * @returns {Array} - List of book metadata objects
 */
export function getBooksFromAnyStructure(bibleData) {
  const structure = analyzeBibleStructure(bibleData);
  
  switch (structure) {
    case 'array':
      return bibleData.map(book => ({
        id: book.name,
        name: book.name,
        abbrev: book.abbrev,
        chapters: book.chapters.length
      }));
      
    case 'object':
    case 'nested':
      return Object.keys(bibleData).map(bookName => {
        const book = bibleData[bookName];
        const chapterCount = typeof book === 'object' ? 
          (book.chapters ? book.chapters.length : Object.keys(book).length) : 
          0;
          
        return {
          id: bookName,
          name: bookName,
          abbrev: book.abbrev || bookName.substring(0, 3),
          chapters: chapterCount
        };
      });
      
    default:
      return [];
  }
}

/**
 * Get verses from a Bible object regardless of its structure
 * @param {Object|Array} bibleData - The imported Bible data
 * @param {String} bookName - Name of the book
 * @param {Number} chapterNum - Chapter number
 * @returns {Array|null} - Array of verse objects with number and text properties
 */
export function getVersesFromAnyStructure(bibleData, bookName, chapterNum) {
  const structure = analyzeBibleStructure(bibleData);
  let verses = null;
  
  switch (structure) {
    case 'array': {
      const book = bibleData.find(b => b.name === bookName);
      if (!book) return null;
      
      const chapter = book.chapters.find(c => c.chapter === Number(chapterNum));
      if (!chapter) return null;
      
      verses = chapter.verses;
      break;
    }
    
    case 'object': {
      const book = bibleData[bookName];
      if (!book) return null;
      
      const chapter = book.chapters ? 
        book.chapters.find(c => c.chapter === Number(chapterNum)) : 
        book[String(chapterNum)];
        
      if (!chapter) return null;
      
      verses = chapter.verses || chapter;
      break;
    }
    
    case 'nested': {
      const book = bibleData[bookName];
      if (!book) return null;
      
      verses = book[String(chapterNum)] || null;
      break;
    }
  }
  
  // Standardize verses format
  if (!verses) return null;
  
  if (Array.isArray(verses)) {
    return verses.map(v => ({
      number: v.verse || v.number,
      text: v.text
    }));
  } else if (typeof verses === 'object') {
    return Object.keys(verses).map(verseNum => ({
      number: parseInt(verseNum),
      text: verses[verseNum]
    })).sort((a, b) => a.number - b.number);
  }
  
  return null;
}
