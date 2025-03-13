/**
 * Mock Bible Service
 * Provides simulated Bible content for development without requiring API calls
 */

// Updated path to data directory
import bibleData from '@/data/bibleContent.json';

/**
 * Fetch Bible content for a specific book, chapter, and language
 * @param {string} book - Bible book name (e.g., "John", "Matthew")
 * @param {number} chapter - Chapter number
 * @param {string} language - Language code ("english", "yoruba", "pidgin")
 * @returns {Promise<Object>} - Bible content with verses and key scenes
 */
export const fetchBibleContent = async (book, chapter, language = 'english') => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Create key for data lookup
  const dataKey = `${book}-${chapter}-${language}`;
  
  // Return data if exists, otherwise return default placeholder
  if (bibleData[dataKey]) {
    return bibleData[dataKey];
  }
  
  // For development purposes, auto-translate English to other languages
  // In production, this would use real translations
  if (language !== 'english') {
    const englishKey = `${book}-${chapter}-english`;
    if (bibleData[englishKey]) {
      return generateMockTranslation(bibleData[englishKey], language);
    }
  }
  
  // Default fallback data
  return generatePlaceholderContent(book, chapter, language);
};

/**
 * Creates mock translations for development purposes
 */
function generateMockTranslation(englishContent, targetLanguage) {
  const translateToYoruba = (text) => `[Yoruba] ${text.substring(0, 10)}...`;
  const translateToPidgin = (text) => `[Pidgin] ${text.substring(0, 10)}...`;
  
  const translatedContent = {
    ...englishContent,
    verses: englishContent.verses.map(verse => ({
      ...verse,
      text: targetLanguage === 'yoruba' 
        ? translateToYoruba(verse.text)
        : translateToPidgin(verse.text)
    }))
  };
  
  return translatedContent;
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
 * Get all available books in the Bible
 * @returns {Promise<Array>} - List of available books
 */
export const getAvailableBooks = async () => {
  return [
    { id: 'Matthew', name: 'Matthew', chapters: 28 },
    { id: 'Mark', name: 'Mark', chapters: 16 },
    { id: 'Luke', name: 'Luke', chapters: 24 },
    { id: 'John', name: 'John', chapters: 21 },
    { id: 'Acts', name: 'Acts', chapters: 28 },
    { id: 'Romans', name: 'Romans', chapters: 16 },
    // More books would be added here
  ];
};

export default {
  fetchBibleContent,
  getAvailableBooks
};