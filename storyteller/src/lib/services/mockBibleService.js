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

// Cache keys for localStorage
const VERSE_CACHE_KEY = 'storyteller-bible-content-cache';

// Create a translation cache to avoid repeated API calls
let contentCache = {};

// Load cache from localStorage on client-side
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem(VERSE_CACHE_KEY);
    if (savedCache) {
      contentCache = JSON.parse(savedCache);
      console.log(`%c📚 Loaded Bible content cache from localStorage with ${Object.keys(contentCache).length} entries`, 
                  'background: #e6f7ff; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    } else {
      console.log('%c💫 No Bible content cache in localStorage', 'color: #ff9900; font-weight: bold;');
    }
  } catch (error) {
    console.error('Failed to load Bible content cache:', error);
    contentCache = {};
  }
  
  // Add to window for debugging
  window.bibleCacheDebug = {
    showCache: () => {
      console.log('Bible content cache:', contentCache);
      return {
        cacheSize: Object.keys(contentCache).length,
        cacheKeys: Object.keys(contentCache)
      };
    },
    clearCache: () => {
      contentCache = {};
      localStorage.removeItem(VERSE_CACHE_KEY);
      console.log('Bible content cache cleared');
      return "Cache cleared";
    }
  };
}

/**
 * Save the cache to localStorage
 */
function saveContentCache() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(VERSE_CACHE_KEY, JSON.stringify(contentCache));
    console.log(`%c💾 Saved Bible content cache to localStorage (${Object.keys(contentCache).length} entries)`, 
                'background: #e6ffe6; color: #006600; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  } catch (error) {
    console.error('Failed to save Bible content cache:', error);
    
    // If storage quota exceeded, prune the cache
    if (error.name === 'QuotaExceededError') {
      // Remove older entries
      const keys = Object.keys(contentCache);
      if (keys.length > 50) {
        const keysToRemove = keys.slice(0, keys.length - 50);
        keysToRemove.forEach(key => delete contentCache[key]);
        
        try {
          localStorage.setItem(VERSE_CACHE_KEY, JSON.stringify(contentCache));
          console.log('Successfully saved cache after pruning');
        } catch (retryError) {
          console.error('Still failed to save cache after pruning:', retryError);
        }
      }
    }
  }
}

/**
 * Fetch Bible content for a specific book, chapter, and language
 * @param {string} book - Bible book name (e.g., "John", "Matthew")
 * @param {number} chapter - Chapter number
 * @param {string} language - Language code ("english", "yoruba", "pidgin")
 * @returns {Promise<Object>} - Bible content with verses and key scenes
 */
export const fetchBibleContent = async (book, chapter, language = 'english') => {
  // Skip caching for English content since we have it locally
  const shouldCache = language !== 'english';
  
  // Create a cache key based on book, chapter, and language
  const cacheKey = `${book}-${chapter}-${language}`;
  
  // Check cache only for non-English content
  if (shouldCache && contentCache[cacheKey]) {
    console.log(`%c🔄 CACHED: Serving ${book} ${chapter} in ${language} from cache`, 
                'background: #fff3cd; color: #856404; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    return contentCache[cacheKey];
  }
  
  console.log(`%c🌐 FETCHING: Bible content for ${book} ${chapter} in ${language}`, 
              'background: #cce5ff; color: #004085; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  
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
      const content = bibleCustomData[customKey];
      // Only store in cache if it's not English
      if (shouldCache) {
        contentCache[cacheKey] = content;
        console.log(`%c📥 CACHED: Added ${book} ${chapter} in ${language} to cache`, 
                    'background: #d4edda; color: #155724; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
        saveContentCache();
      }
      return content;
    }
    
    // Step 4: For English, or chapters without custom data, merge KJV with scene data (if available)
    const keyScenes = hasCustomData ? bibleCustomData[customKey].keyScenes : generateDefaultScenes(book, chapter, verses);
    
    // Step 5: For non-English without custom translation, use translation service
    const translatedVerses = language === 'english' 
      ? verses 
      : await translateVerses(verses, language, 'english', (current, total) => {
          // We could potentially pass a progress callback here if needed
          console.log(`Translation progress: ${current}/${total}`);
        });
    
    const content = {
      book,
      chapter: Number(chapter),
      verses: translatedVerses,
      keyScenes
    };
    
    // Only store in cache if it's not English
    if (shouldCache) {
      contentCache[cacheKey] = content;
      console.log(`%c📥 CACHED: Added ${book} ${chapter} in ${language} to cache`, 
                  'background: #d4edda; color: #155724; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
      saveContentCache();
    }
    
    return content;
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
  
  // Special handling for numbered books
  // First convert spelled-out numbers to digits (First -> 1, Second -> 2)
  let normalizedName = name
    .replace(/^First\s+/i, '1 ')
    .replace(/^Second\s+/i, '2 ')
    .replace(/^Third\s+/i, '3 ')
    .replace(/^I\s+/i, '1 ')
    .replace(/^II\s+/i, '2 ')
    .replace(/^III\s+/i, '3 ');
  
  return normalizedName.toLowerCase()
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
  // Handle potential variations in book names
  const standardizedName = standardizeBookName(bookName);
  
  const newTestamentBooks = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', 
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation', 'Revelation of John'
  ];
  
  // Check for "Revelation of John" explicitly
  if (standardizedName === "Revelation of John" || standardizedName.includes("Revelation")) {
    return "new";
  }
  
  // More flexible matching for numbered books
  for (const book of newTestamentBooks) {
    if (standardizedName.includes(book.toLowerCase().replace(/\s+/g, ''))) {
      return "new";
    }
  }
  
  return newTestamentBooks.includes(standardizedName) ? "new" : "old";
}

/**
 * Standardize book names to canonical form
 */
function standardizeBookName(name) {
  // Handle both forms: "1 Corinthians" and "First Corinthians"
  const standardizedName = name
    .replace(/^First\s+/i, '1 ')
    .replace(/^Second\s+/i, '2 ')
    .replace(/^Third\s+/i, '3 ')
    .replace(/^I\s+/i, '1 ')
    .replace(/^II\s+/i, '2 ')
    .replace(/^III\s+/i, '3 ');
  
  return standardizedName;
}

/**
 * Get all books in the Bible with standardized names
 * @returns {Array} - List of all Bible books with their information
 */
export const getAllBooks = () => {
  // Create a map to prevent duplicate book entries
  const bookMap = new Map();
  
  kjvBible.forEach(book => {
    // Standardize the book name
    const standardizedName = standardizeBookName(book.name);
    const testament = getTestament(standardizedName);
    
    // Create book data object
    const bookData = {
      id: book.name,
      name: standardizedName, // Use standardized name
      originalName: book.name, // Keep original for reference
      abbrev: standardizedName.substring(0, 3),
      chapters: book.chapters.length,
      testament: testament
    };
    
    // Only add the book if it's not already in the map
    if (!bookMap.has(standardizedName)) {
      bookMap.set(standardizedName, bookData);
    }
  });
  
  return Array.from(bookMap.values());
};

// Add a function to clear the translation cache (useful for testing)
export const clearTranslationCache = () => {
  Object.keys(translationCache).forEach(key => {
    delete translationCache[key];
  });
  console.log("Translation cache cleared");
};

// Add this debugging function at the end of the file
export const debugBibleService = () => {
  const books = getAllBooks();
  const bookNames = books.map(book => book.name);
  console.log("All books available:", bookNames);
  console.log("Total books:", bookNames.length);
  console.log("Revelation included:", bookNames.includes("Revelation"));
  
  // Check if the book chapter data exists
  const revelation = books.find(b => b.name === "Revelation");
  console.log("Revelation data:", revelation);
  
  // Also check cache
  const cacheInfo = typeof window !== 'undefined' ? {
    cacheSize: Object.keys(contentCache).length,
    cacheKeys: Object.keys(contentCache),
    localStorageSize: localStorage.getItem(VERSE_CACHE_KEY) ? 
      (localStorage.getItem(VERSE_CACHE_KEY).length / 1024).toFixed(2) + 'KB' : '0KB'
  } : { serverSide: true };
  
  return {
    allBooks: bookNames,
    hasRevelation: bookNames.includes("Revelation"),
    revelationData: revelation,
    cache: cacheInfo
  };
};

// Call this function when the app initializes to debug
if (typeof window !== 'undefined') {
  window.debugBibleService = debugBibleService;
}

export default {
  fetchBibleContent,
  getBookInfo,
  getAllBooks,
  debugBibleService
};