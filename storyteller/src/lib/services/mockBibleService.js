/**
 * Mock Bible Service
 * Provides Bible content from KJV.json with scene annotations
 */

// Import both data sources
import bibleCustomData from '@/data/bibleContent.json';
import kjvData from '@/data/KJV.json';
import { translateVerses } from './translationService';

// Extract the books array from the KJV data structure
const kjvBible = kjvData.books || [];

/**
 * Fetch Bible content for a specific book, chapter, and language
 * @param {string} book - Bible book name (e.g., "John", "Matthew")
 * @param {number} chapter - Chapter number
 * @param {string} language - Language code ("english", "yoruba", "pidgin")
 * @returns {Promise<Object>} - Bible content with verses and key scenes
 */
export const fetchBibleContent = async (book, chapter, language = 'english') => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    // Step 1: Get basic verse content from KJV.json
    const verses = getVersesFromKJV(book, chapter);
    
    if (!verses || verses.length === 0) {
      throw new Error(`No content found for ${book} ${chapter}`);
    }
    
    // Step 2: Check if we have custom annotations for this chapter
    const customKey = `${book}-${chapter}-${language}`;
    const hasCustomData = bibleCustomData[customKey] !== undefined;
    
    // Step 3: If we have custom data and non-English language, use that
    if (language !== 'english' && hasCustomData) {
      return bibleCustomData[customKey];
    }
    
    // Step 4: For English, or chapters without custom data, merge KJV with scene data (if available)
    const keyScenes = hasCustomData ? bibleCustomData[customKey].keyScenes : generateDefaultScenes(book, chapter, verses);
    
    // Step 5: For non-English without custom translation, use translation service
    const translatedVerses = language === 'english' 
      ? verses 
      : await translateVerses(verses, language);
    
    return {
      book,
      chapter: Number(chapter),
      verses: translatedVerses,
      keyScenes
    };
  } catch (error) {
    console.error(`Error fetching Bible content for ${book} ${chapter}:`, error);
    return generatePlaceholderContent(book, chapter, language);
  }
};

/**
 * Extract verses for a given book and chapter from KJV.json
 */
function getVersesFromKJV(book, chapterNum) {
  // Normalize book name for lookup (KJV JSON might use slightly different naming)
  const normalizedBook = normalizeBookName(book);
  
  // Find the book in the KJV data
  const bookObj = kjvBible.find(b => 
    normalizeBookName(b.name) === normalizedBook
  );
  
  if (!bookObj) {
    console.error(`Book not found: ${book}`);
    return null;
  }
  
  // Find the specific chapter
  const chapter = bookObj.chapters.find(c => c.chapter === Number(chapterNum));
  
  if (!chapter) {
    console.error(`Chapter not found: ${book} ${chapterNum}`);
    return null;
  }
  
  // Return verses in the standard format expected by our application
  return chapter.verses.map(v => ({
    number: v.verse,
    text: v.text
  }));
}

/**
 * Normalize book names for consistent comparison
 */
function normalizeBookName(name) {
  if (!name) return '';
  
  return name.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Generate mock translation of text for development
 */
function generateMockTranslation(text, language) {
  if (language === 'yoruba') {
    return `[Yoruba] ${text.substring(0, 30)}...`;
  } else if (language === 'pidgin') {
    return `[Pidgin] ${text.substring(0, 30)}...`;
  }
  return text;
}

/**
 * Generate default scene annotations based on chapter content
 */
function generateDefaultScenes(book, chapter, verses) {
  // Basic chapter coverage
  const midPoint = Math.floor(verses.length / 2);
  
  const scenes = [{
    verseRange: [1, verses.length],
    event: `${book} ${chapter} narrative`,
    characters: findMainCharacters(verses, book),
    setting: determineSetting(book, chapter, verses),
    imageKey: `${book.toLowerCase()}-${chapter}-scene`
  }];
  
  // For longer chapters, add a second scene at midpoint
  if (verses.length > 20) {
    scenes.push({
      verseRange: [midPoint, verses.length],
      event: `${book} ${chapter} continuation`,
      characters: findMainCharacters(verses.slice(midPoint), book),
      setting: determineSetting(book, chapter, verses.slice(midPoint)),
      imageKey: `${book.toLowerCase()}-${chapter}-scene-2`
    });
  }
  
  return scenes;
}

/**
 * Attempt to determine main characters from verse text
 */
function findMainCharacters(verses, book) {
  // Common biblical names to look for
  const commonNames = ['Jesus', 'Christ', 'Peter', 'John', 'Matthew', 'Mark', 'Luke', 'Paul', 'Mary'];
  const text = verses.map(v => v.text).join(' ');
  
  const foundNames = commonNames.filter(name => 
    text.includes(name) || text.includes(name + '\'s')
  );
  
  return foundNames.length > 0 ? 
    foundNames.join(', ') : 
    `Characters from ${book}`;
}

/**
 * Attempt to determine setting based on verse content
 */
function determineSetting(book, chapter, verses) {
  const text = verses.map(v => v.text).join(' ').toLowerCase();
  
  if (text.includes('mountain') || text.includes('hill')) return 'Mountain';
  if (text.includes('sea') || text.includes('boat') || text.includes('water')) return 'Sea of Galilee';
  if (text.includes('temple')) return 'Temple';
  if (text.includes('house')) return 'House';
  if (text.includes('garden')) return 'Garden';
  if (text.includes('desert') || text.includes('wilderness')) return 'Wilderness';
  
  return 'Biblical setting';
}

/**
 * Generates placeholder Bible content when no data exists
 */
function generatePlaceholderContent(book, chapter, language) {
  return {
    book,
    chapter,
    verses: [
      { number: 1, text: `Sample verse 1 for ${book} ${chapter} in ${language}` },
      { number: 2, text: `Sample verse 2 for ${book} ${chapter} in ${language}` },
      { number: 3, text: `Sample verse 3 for ${book} ${chapter} in ${language}` }
    ],
    keyScenes: [
      {
        verseRange: [1, 3],
        event: `${book} narrative`,
        characters: "Biblical characters",
        setting: "Biblical setting"
      }
    ]
  };
}

/**
 * Get information about a specific book
 * @param {string} bookName - Name of the book
 * @returns {Object|null} - Book information or null if not found
 */
export const getBookInfo = (bookName) => {
  const normalizedName = normalizeBookName(bookName);
  
  const book = kjvBible.find(b => 
    normalizeBookName(b.name) === normalizedName
  );
  
  if (!book) return null;
  
  return {
    name: book.name,
    chapters: book.chapters.length,
    testament: getTestament(book.name)
  };
};

/**
 * Determine Old or New Testament
 */
function getTestament(bookName) {
  const newTestamentBooks = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', 
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];
  
  return newTestamentBooks.includes(bookName) ? 'New Testament' : 'Old Testament';
}

/**
 * Get all books in the Bible
 * @returns {Array} - List of all Bible books with their information
 */
export const getAllBooks = () => {
  return kjvBible.map(book => ({
    id: book.name,
    name: book.name,
    abbrev: book.name.substring(0, 3),
    chapters: book.chapters.length,
    testament: getTestament(book.name)
  }));
};

export default {
  fetchBibleContent,
  getBookInfo,
  getAllBooks
};