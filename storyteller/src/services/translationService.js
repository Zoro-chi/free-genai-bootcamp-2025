import axios from 'axios';
import { config } from '@/lib/config';
import bedrockService from './bedrockService';

// For AWS Bedrock integration - conditionally import if needed
let InvokeModelCommand;
let getBedrockRuntime;
let isAwsConfigured;

// Try to import AWS-related functions if they exist
try {
  const awsModule = require('@/lib/aws-config');
  if (awsModule) {
    ({ getBedrockRuntime, isAwsConfigured } = awsModule);
    // Dynamic import for AWS SDK to avoid issues on client side
    const { InvokeModelCommand: IMC } = require("@aws-sdk/client-bedrock-runtime");
    InvokeModelCommand = IMC;
  }
} catch (error) {
  // AWS Integration not available, will fallback to mock
  console.log('AWS integration not available, will use mock translations');
}

/**
 * Service for translating Bible verses to Nigerian languages
 */

// Language codes for API calls
const languageCodes = {
  english: 'en',
  yoruba: 'yo',
  igbo: 'ig',
  hausa: 'ha',
  pidgin: 'pcm'
};

// Helper to determine if we're running on the server
const isServer = typeof window === 'undefined';

// Cache key for localStorage
const CACHE_STORAGE_KEY = 'storyteller-translation-cache';

// Initialize translation cache
let translationCache = {
  yoruba: {},  // { verseKey: translatedText }
  igbo: {},
  pidgin: {},
  hausa: {}
};

// Load cache from localStorage if available
if (!isServer) {
  // Load immediately on module import
  const loadCacheFromStorage = () => {
    try {
      const savedCache = localStorage.getItem(CACHE_STORAGE_KEY);
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        translationCache = parsed;
        console.log(`%c📚 Loaded ${Object.keys(parsed).length} languages from localStorage cache`, 'background: #e6f7ff; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
        
        // Log some statistics about the cache
        let totalEntries = 0;
        Object.keys(parsed).forEach(lang => {
          if (typeof parsed[lang] === 'object') {
            const count = Object.keys(parsed[lang]).length;
            totalEntries += count;
            console.log(`Cache for ${lang}: ${count} entries`);
          }
        });
        console.log(`Total cached translations: ${totalEntries}`);
      } else {
        console.log('%c💫 No translation cache in localStorage - will create new cache', 'color: #ff9900; font-weight: bold;');
      }
    } catch (error) {
      console.error('Failed to load translation cache from localStorage:', error);
    }
  };
  
  // Execute immediately
  loadCacheFromStorage();
  
  // Also make it globally available for debugging
  if (typeof window !== 'undefined') {
    window.translationDebug = {
      inspectCache: () => {
        const cacheData = debugTranslationCache();
        console.log('%c📊 Translation Cache Status:', 'background: #e6f7ff; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;', cacheData);
        return cacheData;
      },
      clearCache: () => {
        clearTranslationCache();
        return "Cache cleared";
      },
      saveToLocalStorage: () => {
        saveCache();
        return "Cache saved to localStorage";
      }
    };
  }
}

/**
 * Save the current cache to localStorage
 */
function saveCache() {
  if (isServer) return;
  
  try {
    // Stringify the cache and save it to localStorage
    const serialized = JSON.stringify(translationCache);
    localStorage.setItem(CACHE_STORAGE_KEY, serialized);
    
    // Calculate the size of the cache for logging
    const sizeInKB = (serialized.length / 1024).toFixed(2);
    console.log(`%c💾 Saved translation cache to localStorage (${sizeInKB}KB)`, 'background: #e6ffe6; color: #006600; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  } catch (error) {
    console.error('Failed to save translation cache to localStorage:', error);
    
    // If it's a quota error, try clearing older entries
    if (error.name === 'QuotaExceededError') {
      pruneCache();
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(translationCache));
        console.log('Successfully saved cache after pruning');
      } catch (retryError) {
        console.error('Still failed to save cache after pruning:', retryError);
      }
    }
  }
}

/**
 * Reduce cache size by removing older/less used entries
 */
function pruneCache() {
  // Simple strategy: keep only 20 most recent translations per language
  for (const lang in translationCache) {
    const entries = Object.entries(translationCache[lang]);
    if (entries.length > 20) {
      // Sort by most recently used (assuming we're not tracking usage time)
      const pruned = entries.slice(-20);
      translationCache[lang] = Object.fromEntries(pruned);
    }
  }
  console.log('Pruned translation cache to reduce size');
}

/**
 * Get the base URL for API calls depending on environment
 */
function getBaseUrl() {
  if (!isServer) {
    // Browser side - use relative URLs
    return '';
  }
  
  // Server side - need absolute URLs
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback to localhost during development/testing
  return process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com' // Replace with actual production domain
    : 'http://localhost:3000';
}

/**
 * Validate a translation result and fix common issues
 * @param {string} text - The original text being translated
 * @param {string} translatedText - The translation result to validate
 * @return {string} The cleaned translation or error message
 */
function validateTranslation(text, translatedText) {
  if (!translatedText) return '[Translation error: Empty result]';
  
  // Check for extremely repetitive patterns (repeating the same phrase many times)
  const maxRepeatCount = 5; // Maximum times a phrase can repeat
  
  // Find repeating sequences of 5+ characters
  const findRepeatingPatterns = (text) => {
    const potentialPatterns = [];
    // Look for patterns of different lengths
    for (let patternLength = 5; patternLength < 25; patternLength++) {
      for (let i = 0; i < text.length - patternLength; i++) {
        const pattern = text.substring(i, i + patternLength);
        // Count occurrences
        let count = 0;
        let pos = -1;
        while ((pos = text.indexOf(pattern, pos + 1)) !== -1) {
          count++;
        }
        
        if (count > maxRepeatCount) {
          potentialPatterns.push({ pattern, count });
        }
      }
    }
    return potentialPatterns;
  };
  
  const patterns = findRepeatingPatterns(translatedText);
  
  if (patterns.length > 0) {
    console.warn(`Found repetitive pattern in translation: "${patterns[0].pattern}" repeats ${patterns[0].count} times`);
    
    // For extremely repetitive patterns, truncate at a reasonable point
    const truncationPoint = translatedText.indexOf(patterns[0].pattern) + patterns[0].pattern.length * 2;
    if (truncationPoint > 0 && truncationPoint < translatedText.length / 2) {
      const truncated = translatedText.substring(0, truncationPoint) + '...';
      console.log(`Truncated repetitive translation from ${translatedText.length} to ${truncated.length} characters`);
      return truncated;
    }
    
    // If truncation isn't feasible, return a fallback translation
    const approximateLength = Math.min(text.length * 1.2, 100); // Allow for some expansion in translation
    if (translatedText.length > approximateLength * 2) {
      console.warn(`Translation is suspiciously long (${translatedText.length} chars vs expected ~${approximateLength})`);
      return translatedText.substring(0, approximateLength) + '...';
    }
  }
  
  return translatedText;
}

/**
 * Main function to translate text to a target Nigerian language
 */
export async function translateText(text, targetLanguage, sourceLanguage = 'english') {
  // Normalize language name
  const normalizedLanguage = targetLanguage.toLowerCase();
  
  // Skip translation if target is the same as source
  if (normalizedLanguage === sourceLanguage.toLowerCase() || normalizedLanguage === 'english') {
    return text;
  }
  
  // Generate a cache key for this text - make it deterministic and short
  const cacheKey = `${text.substring(0, 50).trim()}`;
  
  // Check if real translation is enabled in config
  const useRealTranslation = config?.features?.realTranslation || 
                             process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION === 'true';
  
  // Initialize language cache if needed
  if (!translationCache[normalizedLanguage]) {
    translationCache[normalizedLanguage] = {};
  }
  
  // Check cache first if not disabled
  if (translationCache[normalizedLanguage][cacheKey]) {
    console.log(`%c🔄 CACHED: Using cached translation for '${cacheKey.substring(0, 20)}...' (${normalizedLanguage})`, 
                'background: #fff3cd; color: #856404; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    return translationCache[normalizedLanguage][cacheKey];
  }

  try {
    let translatedText = '';
    
    // If real translation is disabled, use mock
    if (!useRealTranslation) {
      console.log('🔄 Using mock translation (real translation disabled)');
      translatedText = bedrockService.generateMockTranslation(text, normalizedLanguage);
    } else {
      // Determine which provider to use
      const provider = process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 
                       (config?.translation?.provider) || 
                       'mock';
      
      console.log(`🔄 Using real translation with provider: ${provider}`);
      
      switch (provider.toLowerCase()) {
        case 'openai':
          translatedText = await translateWithOpenAI(text, normalizedLanguage, sourceLanguage);
          break;
        case 'bedrock':
        case 'amazonbedrock':
          translatedText = await translateWithBedrock(text, normalizedLanguage, sourceLanguage);
          break;
        case 'huggingface':
          translatedText = await translateWithHuggingFace(text, normalizedLanguage, sourceLanguage);
          break;
        default:
          // Fallback to mock if provider is unknown
          console.log('⚠️ Unknown provider, falling back to mock');
          translatedText = bedrockService.generateMockTranslation(text, normalizedLanguage);
      }
    }

    // Validate the translation result before saving to cache
    translatedText = validateTranslation(text, translatedText);

    // Save to cache
    translationCache[normalizedLanguage][cacheKey] = translatedText;
    console.log(`%c📥 NEW: Added translation to cache for '${cacheKey.substring(0, 20)}...' (${normalizedLanguage})`, 
                'background: #d4edda; color: #155724; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    
    // Save updated cache to localStorage
    saveCache();
    
    return translatedText;
  } catch (error) {
    console.error(`Translation error (${targetLanguage}):`, error);
    // Return a marked-up version of the original text as fallback
    return `[${targetLanguage}] ${text}`;
  }
}

/**
 * Translate text using OpenAI's API
 */
async function translateWithOpenAI(text, targetLanguage, sourceLanguage = 'english') {
  const languagePrompts = {
    yoruba: "Translate the following Bible verse to Yoruba, maintaining the reverent and sacred tone:",
    igbo: "Translate the following Bible verse to Igbo, maintaining the reverent and sacred tone:",
    pidgin: "Translate the following Bible verse to Nigerian Pidgin English, maintaining the reverent and sacred tone:",
    hausa: "Translate the following Bible verse to Hausa, maintaining the reverent and sacred tone:"
  };
  
  // Enhanced prompt with more constraints
  const prompt = `${languagePrompts[targetLanguage] || `Translate to ${targetLanguage}:`}
The translation should be concise and natural in ${targetLanguage}, and similar in length to the original.
Avoid repetition and loops in your translation. Focus on clarity and accuracy.

Text to translate:
"${text}"`;
  
  const baseUrl = getBaseUrl();
  const response = await axios.post(`${baseUrl}/api/translate`, {
    provider: 'openai',
    text,
    language: targetLanguage,
    sourceLanguage,
    prompt,
    // Add max tokens constraint to avoid overly long responses
    maxTokens: Math.min(text.length * 4, 500)
  });
  
  if (!response.data || !response.data.translation) {
    throw new Error('Invalid response from translation API');
  }
  
  // Validate and clean the translation before returning
  return validateTranslation(text, response.data.translation);
}

/**
 * Translate text using Amazon Bedrock
 */
async function translateWithBedrock(text, targetLanguage, sourceLanguage = 'english') {
  // Check if AWS is configured before making API calls
  if (!bedrockService.checkBedrockConfig()) {
    console.log('🔄 AWS credentials not configured, falling back to mock translation');
    return bedrockService.generateMockTranslation(text, targetLanguage);
  }

  // Create the translation prompt
  const prompt = bedrockService.createTranslationPrompt(text, targetLanguage, sourceLanguage);

  try {
    // Try using direct Bedrock call if we're on the server
    if (isServer) {
      const bedrockClient = bedrockService.getBedrockClient();
      if (bedrockClient) {
        return await bedrockService.translateWithBedrockModels(bedrockClient, prompt, text);
      }
    }
    
    // Otherwise use the API endpoint
    const baseUrl = getBaseUrl();
    const response = await axios.post(`${baseUrl}/api/translate`, {
      provider: 'bedrock',
      text,
      language: targetLanguage,
      sourceLanguage,
      prompt
    });
    
    if (!response.data || !response.data.translation) {
      throw new Error('Invalid response from translation API');
    }
    
    return response.data.translation;
  } catch (error) {
    console.error(`🔄 Bedrock translation failed: ${error.message}`);
    // Fall back to mock translation
    return bedrockService.generateMockTranslation(text, targetLanguage);
  }
}

/**
 * Translate text using Hugging Face models
 */
async function translateWithHuggingFace(text, targetLanguage, sourceLanguage = 'english') {
  const baseUrl = getBaseUrl();
  const response = await axios.post(`${baseUrl}/api/translate`, {
    provider: 'huggingface',
    text,
    language: targetLanguage,
    sourceLanguage
  });
  
  if (!response.data || !response.data.translation) {
    throw new Error('Invalid response from translation API');
  }
  
  return response.data.translation;
}

/**
 * Generate mock translation for development
 */
function generateMockTranslation(text, targetLanguage) {
  const languagePrefixes = {
    yoruba: "[YORUBA] ",
    igbo: "[IGBO] ",
    pidgin: "[PIDGIN] ",
    hausa: "[HAUSA] "
  };
  
  // Make sure all languages have a mock implementation
  if (!languagePrefixes[targetLanguage]) {
    console.warn(`No mock translation prefix defined for language: ${targetLanguage}`);
    return `[${targetLanguage.toUpperCase()}] ${text}`;
  }
  
  const prefix = languagePrefixes[targetLanguage];
  return `${prefix}${text}`;
}

/**
 * Translate a full set of verses with progress callback
 */
export async function translateVerses(verses, language, sourceLanguage = 'english', progressCallback = null) {
  // Skip unnecessary work for English
  if (language === 'english') return verses;
  
  // Create a cache key based on verse content and language
  // Using the first and last verse as an identifier
  const firstVerse = verses.length > 0 ? verses[0].text.substring(0, 20) : '';
  const lastVerse = verses.length > 0 ? verses[verses.length - 1].text.substring(0, 20) : '';
  const versesKey = `${language}-verses-${firstVerse}-${lastVerse}-${verses.length}`;
  
  // Ensure we have a verses cache
  if (!translationCache.verses) {
    translationCache.verses = {};
  }
  
  // Check for complete set in cache
  if (translationCache.verses[versesKey]) {
    console.log(`%c🔄 CACHED: Using cached verse set for ${language} (${verses.length} verses)`, 
                'background: #fff3cd; color: #856404; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
                
    // Report completed progress
    if (progressCallback) {
      progressCallback(verses.length, verses.length);
    }
    
    return translationCache.verses[versesKey];
  }
  
  console.log(`%c🌐 TRANSLATING: ${verses.length} verses to ${language}...`, 
              'background: #cce5ff; color: #004085; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  
  // Determine optimal batch size based on verses count
  // Smaller batches for more verses to show progress faster
  const batchSize = verses.length > 50 ? 3 : (verses.length > 20 ? 5 : 8);
  const result = [...verses]; // Clone array
  let translatedCount = 0;
  
  // Use a more efficient concurrency approach
  const translateBatch = async (startIndex) => {
    const endIndex = Math.min(startIndex + batchSize, verses.length);
    const batch = verses.slice(startIndex, endIndex);
    
    // Process batch in parallel
    const translations = await Promise.all(
      batch.map(verse => {
        // First check if this specific verse is already in cache
        const verseKey = `${verse.text.substring(0, 30).trim()}`;
        if (translationCache[language] && translationCache[language][verseKey]) {
          return Promise.resolve(translationCache[language][verseKey]);
        }
        return translateText(verse.text, language, sourceLanguage);
      })
    );
    
    translations.forEach((translatedText, index) => {
      result[startIndex + index] = {
        ...result[startIndex + index],
        text: translatedText
      };
    });
    
    translatedCount += batch.length;
    
    // Report progress
    if (progressCallback) {
      progressCallback(translatedCount, verses.length);
    }
    
    console.log(`Translated batch ${Math.floor(startIndex/batchSize) + 1}/${Math.ceil(verses.length/batchSize)}`);
    
    return endIndex;
  };
  
  // Process batches sequentially to avoid rate limits but translate within batch in parallel
  let currentIndex = 0;
  while (currentIndex < verses.length) {
    currentIndex = await translateBatch(currentIndex);
    
    // Small delay between batches to avoid rate limiting
    if (currentIndex < verses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Store the complete set in cache
  translationCache.verses[versesKey] = result;
  console.log(`%c📥 CACHED: Saved complete verse set for ${language} (${verses.length} verses)`, 
              'background: #d4edda; color: #155724; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
  
  // Save to localStorage
  saveCache();
  
  return result;
}

// Optimize prompts for faster translation by making them shorter
/**
 * Creates a more concise translation prompt
 */
function createOptimizedTranslationPrompt(text, targetLanguage, sourceLanguage) {
  return `Translate from ${sourceLanguage} to ${targetLanguage}: "${text}"`;
}

/**
 * Determine optimal provider for a specific language
 */
export function getOptimalProvider(language) {
  switch(language.toLowerCase()) {
    case 'yoruba':
    case 'igbo':
    case 'pidgin':
    case 'hausa':
      // Use Claude model for Nigerian languages (better performance)
      return 'bedrock';
    default:
      // Default provider from config
      return process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 
             (config?.translation?.provider) || 
             'bedrock';
  }
}

/**
 * Debug utility to inspect the translation cache
 */
export const debugTranslationCache = () => {
  // Count entries
  let totalEntries = 0;
  const details = {};
  
  Object.keys(translationCache).forEach(lang => {
    if (typeof translationCache[lang] === 'object') {
      const count = Object.keys(translationCache[lang]).length;
      totalEntries += count;
      details[lang] = count;
    }
  });
  
  // Get localStorage info
  let storageInfo = null;
  if (!isServer) {
    try {
      const storageData = localStorage.getItem(CACHE_STORAGE_KEY);
      storageInfo = {
        exists: !!storageData,
        sizeInBytes: storageData ? storageData.length : 0,
        sizeInKB: storageData ? Math.round(storageData.length / 1024) : 0
      };
    } catch (e) {
      storageInfo = { error: e.message };
    }
  }
  
  return {
    inMemory: {
      cacheSize: totalEntries,
      languageDetails: details,
    },
    localStorage: storageInfo,
    sample: totalEntries > 0 ? getSampleFromCache() : null
  };
};

// Helper to get a sample entry from cache
function getSampleFromCache() {
  for (const lang in translationCache) {
    if (typeof translationCache[lang] === 'object') {
      const keys = Object.keys(translationCache[lang]);
      if (keys.length > 0) {
        const sampleKey = keys[0];
        return {
          language: lang,
          key: sampleKey,
          value: translationCache[lang][sampleKey]
        };
      }
    }
  }
  return null;
}

/**
 * Clear the translation cache (useful for testing)
 */
export const clearTranslationCache = () => {
  translationCache = {
    yoruba: {},
    igbo: {},
    pidgin: {},
    hausa: {},
    verses: {}
  };
  
  if (!isServer) {
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
      console.log("Translation cache cleared from localStorage");
    } catch (error) {
      console.error('Failed to clear translation cache from localStorage:', error);
    }
  }
  
  return { success: true, message: "Cache cleared" };
};

// Export debug functions to window for easier debugging in browser
if (!isServer) {
  window.translationDebug = {
    inspectCache: debugTranslationCache,
    clearCache: clearTranslationCache,
    loadCache: () => {
      try {
        const saved = localStorage.getItem(CACHE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
      } catch (e) {
        return { error: e.message };
      }
    }
  };
}

// Export default object with functions
export default {
  translateText,
  translateVerses,
  getOptimalProvider,
  debugTranslationCache,
  clearTranslationCache
};
