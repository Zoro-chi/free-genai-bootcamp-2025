import axios from 'axios';
import { config } from '@/lib/config';

// Cache key for localStorage
const CHAPTER_IMAGES_CACHE_KEY = 'storyteller-chapter-images-cache';

// Initialize cache
let imageCache = {};

// Load cache if on client side
if (typeof window !== 'undefined') {
  try {
    const savedCache = localStorage.getItem(CHAPTER_IMAGES_CACHE_KEY);
    if (savedCache) {
      imageCache = JSON.parse(savedCache);
      // Clean up old cache entries
      cleanupCache();
    }
  } catch (error) {
    console.error('Failed to load image cache:', error);
    imageCache = {};
  }
}

/**
 * Clean up old cache entries based on TTL
 */
function cleanupCache() {
  const now = Date.now();
  const ttlDays = config.imageGeneration.cacheTTL || 30;
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  
  Object.keys(imageCache).forEach(key => {
    if (imageCache[key].timestamp && now - imageCache[key].timestamp > ttlMs) {
      console.log(`Removing old cache entry: ${key}`);
      delete imageCache[key];
    }
  });
  
  // Save cleaned cache
  saveCache();
}

/**
 * Save cache to localStorage
 */
function saveCache() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CHAPTER_IMAGES_CACHE_KEY, JSON.stringify(imageCache));
    } catch (error) {
      console.error('Failed to save image cache:', error);
      
      // If quota exceeded, prune cache
      if (error.name === 'QuotaExceededError') {
        pruneCache();
        try {
          localStorage.setItem(CHAPTER_IMAGES_CACHE_KEY, JSON.stringify(imageCache));
        } catch (retryError) {
          console.error('Still failed to save cache after pruning:', retryError);
        }
      }
    }
  }
}

/**
 * Reduce cache size by removing older entries
 */
function pruneCache() {
  const entries = Object.entries(imageCache);
  if (entries.length > 20) {
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));
    
    // Keep only newest 20 entries
    const newCache = {};
    entries.slice(-20).forEach(([key, value]) => {
      newCache[key] = value;
    });
    
    imageCache = newCache;
    console.log('Pruned image cache to 20 entries');
  }
}

/**
 * Analyze a chapter and determine optimal image segments
 * @param {Array} verses - Array of verse objects with text
 * @param {number} maxImages - Maximum number of images to generate
 * @returns {Array} - Array of scene objects with verse ranges
 */
export function analyzeChapterForImageSegments(verses, maxImages = config.imageGeneration.maxImagesPerChapter) {
  if (!verses || verses.length === 0) return [];
  
  // STRICTLY enforce the limit from config - never allow more than this number
  const HARD_LIMIT = config.imageGeneration.maxImagesPerChapter;
  
  // Override any passed in maxImages parameter with the hard limit
  maxImages = Math.min(maxImages, HARD_LIMIT);
  
  console.log(`STRICT LIMIT: Will generate maximum of ${maxImages} images (from config: ${HARD_LIMIT})`);
  
  const segments = [];
  const totalVerses = verses.length;
  
  // For very short chapters, just one image
  if (totalVerses <= 5) {
    segments.push({
      verseRange: [1, totalVerses],
      startVerse: 1,
      endVerse: totalVerses,
      verseContent: verses.map(v => v.text).join(' '),
      event: `Full chapter visualization`,
      characters: extractCharacters(verses),
      setting: extractSetting(verses)
    });
    return segments;
  }
  
  // Calculate optimal count but NEVER exceed maxImages
  // Simplify this calculation to avoid any unexpected behavior
  const versesPerSegment = Math.ceil(totalVerses / maxImages);
  
  // Create segments
  for (let i = 0; i < totalVerses && segments.length < maxImages; i += versesPerSegment) {
    const startVerse = i + 1;
    const endVerse = Math.min(i + versesPerSegment, totalVerses);
    const segmentVerses = verses.slice(i, i + versesPerSegment);
    
    // Skip if no verses in this segment (shouldn't happen)
    if (segmentVerses.length === 0) continue;
    
    // Extract key content from these verses
    const segmentContent = segmentVerses.map(v => v.text).join(' ');
    
    segments.push({
      verseRange: [startVerse, endVerse],
      startVerse,
      endVerse,
      verseContent: segmentContent.slice(0, 300), // Limit length for prompt
      event: `Scene from verses ${startVerse}-${endVerse}`,
      characters: extractCharacters(segmentVerses),
      setting: extractSetting(segmentVerses)
    });
    
    // ADDITIONAL CHECK: Break immediately if we've reached the limit
    if (segments.length >= maxImages) {
      console.log(`Reached maximum image count (${maxImages}), stopping segment creation`);
      break;
    }
  }
  
  // Final safety check - always enforce the limit
  if (segments.length > maxImages) {
    console.warn(`Still exceeded limit - forcing cap at ${maxImages} images`);
    return segments.slice(0, maxImages);
  }
  
  console.log(`Generated ${segments.length} segments with limit ${maxImages}`);
  return segments;
}

/**
 * Extract character names from verse text
 */
function extractCharacters(verses) {
  const commonNames = [
    // Key Biblical Figures
    "Jesus", "God", "Moses", "David", "Paul", "Peter", "John", "Mary", "Joseph",
    "Abraham", "Isaac", "Jacob", "Sarah", "Rebekah", "Rachel", "Leah", "Samuel", "Solomon",
    "Elijah", "Elisha", "Jeremiah", "Daniel", "Joshua", "Gideon", "Esther", "Ruth", "Nehemiah",
    "Ezra", "Miriam", "Deborah", "Rahab", "Naomi", "Lydia", "Barnabas", "Silas", "Stephen",
    "Andrew", "Philip", "Benjamin", "Jonathan", "Saul", "Job", "Eve", "Cain", "Abel",
    "Hezekiah", "Josiah",
    
    // The 12 Disciples (Apostles)
    "Bartholomew", "Matthew", "James the Greater", "James the Less", "Thaddeus", "Simon the Zealot", "Judas Iscariot",
    
    // The 12 Tribes of Israel (additional names not already listed)
    "Reuben", "Simeon", "Levi", "Judah", "Dan", "Naphtali", "Gad", "Asher", "Issachar", "Zebulun",
    
    // Prophets (Old & New Testament)
    "Isaiah", "Ezekiel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi", "Nathan", "John the Baptist", "Agabus",
    
    // Angels
    "Michael", "Gabriel", "Raphael"
  ];

  const text = verses.map(v => v.text || "").join(" ");
  
  const foundNames = commonNames.filter(name => 
    text.includes(name)
  );
  
  return foundNames.length > 0 ? foundNames.join(", ") : "Biblical figures";
}

/**
 * Extract setting information from verse text
 */
function extractSetting(verses) {
  const commonPlaces = [
    // Major Biblical Cities
    "Jerusalem", "Bethlehem", "Nazareth", "Capernaum", "Jericho", "Samaria", "Hebron", "Shechem", "Shiloh",
    "Damascus", "Antioch", "Ephesus", "Corinth", "Rome", "Babylon", "Nineveh", "Susa", "Alexandria", "Laodicea",
    "Philadelphia", "Pergamum", "Smyrna", "Thyatira", "Sardis", "Colossae", "Tarsus", "Cyrene",
    
    // Regions & Kingdoms
    "Israel", "Judah", "Samaria", "Galilee", "Judea", "Moab", "Edom", "Ammon", "Philistia", "Aram", "Assyria",
    "Babylonia", "Persia", "Canaan", "Midian", "Goshen", "Phoenicia", "Cilicia", "Macedonia", "Thessalonica",
    
    // Mountains & Hills
    "Mount Sinai", "Mount Ararat", "Mount Moriah", "Mount Zion", "Mount of Olives", "Mount Carmel", "Mount Nebo",
    "Mount Hermon", "Mount Tabor", "Mount Gilboa", "Mount Gerizim", "Mount Ebal",
    
    // Rivers & Bodies of Water
    "Jordan River", "Nile River", "Euphrates River", "Tigris River", "Sea of Galilee", "Dead Sea", "Red Sea",
    "Mediterranean Sea", "Pool of Bethesda", "Gihon Spring",
    
    // Deserts & Wildernesses
    "Wilderness of Sinai", "Wilderness of Paran", "Wilderness of Shur", "Wilderness of Zin", "Negev",
    
    // Notable Biblical Locations
    "Garden of Eden", "Tower of Babel", "Sodom", "Gomorrah", "Bethel", "Beersheba", "Ai", "Gethsemane",
    "Calvary (Golgotha)", "Patmos", "Armageddon"
  ];
  
  const text = verses.map(v => v.text || "").join(" ");
  
  const foundPlaces = commonPlaces.filter(place => 
    text.includes(place)
  );
  
  return foundPlaces.length > 0 ? foundPlaces.join(", ") : "Biblical setting";
}

/**
 * Generate all images for a chapter
 * @param {string} book - Bible book name
 * @param {number} chapter - Chapter number
 * @param {Array} verses - Array of verse objects
 * @param {string} provider - Image provider (openai, bedrock)
 * @param {string} language - Language for culturally appropriate imagery
 * @returns {Promise<Array>} - Array of image segments with URLs
 */
export async function generateChapterImages(book, chapter, verses, provider = 'openai', language = 'english') {
  // Determine if we should use mock images with clearer logic for env variables
  const envMockValue = process.env.NEXT_PUBLIC_USE_MOCK_IMAGES;
  const envUsesMock = envMockValue === 'true';
  const envDisablesMock = envMockValue === 'false'; // Explicitly check for 'false'
  
  // If NEXT_PUBLIC_USE_MOCK_IMAGES=false is set, that should override config
  const useMockImages = envDisablesMock ? false : 
                       (envUsesMock || config.imageGeneration.useMockImages);
  
  console.log(`Chapter images mode: ${useMockImages ? 'MOCK' : 'REAL'} (env: ${envMockValue}, config: ${config.imageGeneration.useMockImages})`);
  
  // Cache key should include current mock setting to prevent using cached mock images
  const mockSetting = useMockImages ? 'mock' : 'real';
  const LIMIT = config.imageGeneration.maxImagesPerChapter;
  const cacheKey = `${book}-${chapter}-${language}-${provider}-${mockSetting}-limit${LIMIT}`;
  
  // Check cache first - but only if the cache entry matches our mock/real setting
  if (imageCache[cacheKey] && imageCache[cacheKey].segments && 
      imageCache[cacheKey].isMock === useMockImages) { // Only use cache if mock setting matches
    console.log(`Using cached images for ${book} ${chapter} in ${language} (limit: ${LIMIT}, mock: ${useMockImages})`);
    const cachedSegments = imageCache[cacheKey].segments.slice(0, LIMIT);
    return cachedSegments;
  }
  
  // Clear all old cache entries for this chapter/language to ensure clean state
  clearOldCacheEntries(book, chapter, language);
  
  console.log(`Starting image generation for ${book} ${chapter} with limit ${LIMIT}`);
  
  // Get segments with strict enforcement of limits
  let segments = analyzeChapterForImageSegments(verses, LIMIT);
  
  // Always double-check the limit
  segments = segments.slice(0, LIMIT);
  
  console.log(`Will generate ${segments.length} images for ${book} ${chapter} (mock mode: ${useMockImages})`);
  
  // Special handling for mock mode - just assign placeholder images to segments
  if (useMockImages) {
    segments.forEach((segment, index) => {
      const placeholderIndex = (index % config.imageGeneration.mockImageCount) + 1;
      const placeholderDir = config.imageGeneration.mockImageDir || '/images/placeholders';
      segment.imageUrl = `${placeholderDir}/${placeholderIndex}.jpg`;
      segment.loading = false;
      segment.isMock = true;
    });
    
    // Cache the mock results
    imageCache[cacheKey] = {
      segments,
      timestamp: Date.now(),
      configLimit: LIMIT,
      isMock: true,
      language
    };
    saveCache();
    
    return segments;
  }
  
  // Only proceed with real image generation if not in mock mode
  try {
    // Add default placeholder images to each segment first - these will be replaced
    segments.forEach((segment, index) => {
      // Assign a placeholder as default - will be replaced if API call succeeds
      segment.imageUrl = `/images/placeholders/${(index % 5) + 1}.jpg`;
      segment.loading = true; // Add loading flag for progressive updates
      segment.isMock = false; // Mark this as a real image (even though it has a placeholder for now)
    });
    
    // Set up maximum concurrent requests (3 is a good balance)
    const MAX_CONCURRENT = 3;
    
    // Create a pool of concurrent image generation tasks
    const generateImageWithConcurrency = async (segments) => {
      // Track active promises
      const activePromises = new Set();
      // Track rate limit encounters
      let hitRateLimit = false;
      // Count of generation attempts
      let attemptsMade = 0;

      // Process all segments
      for (let i = 0; i < segments.length; i++) {
        // If we hit a rate limit, stop processing more segments
        if (hitRateLimit) break;
        
        // Wait until we have room in the concurrency pool
        while (activePromises.size >= MAX_CONCURRENT) {
          // Wait for any promise to complete
          await Promise.race([...activePromises]);
        }
        
        // Create and start a new image generation task
        const segment = segments[i];
        
        const generatePromise = (async () => {
          attemptsMade++;
          try {
            // Generate the image with language parameter and force real image generation
            const response = await axios.post('/api/generate-image', {
              biblicalEvent: `${book} ${chapter}:${segment.startVerse}-${segment.endVerse}`,
              characters: segment.characters,
              setting: segment.setting,
              verseContent: segment.verseContent,
              language, 
              provider,
              bypassMock: true // Always force real images when mock mode is disabled
            });
            
            if (response.data && response.data.imageUrl) {
              // Check if the response is a mock/placeholder image despite our bypass request
              const imageUrl = response.data.imageUrl;
              const isMockResponse = imageUrl.includes('/images/placeholders/') || response.data.isMock;
              
              if (isMockResponse && !useMockImages) {
                // We got a mock response when we wanted a real image
                console.warn(`Got mock image for segment ${i+1} despite bypass request.`);
                // Keep the placeholder image but mark it clearly as a fallback
                segment.fallbackUsed = true;
              } else {
                // Valid non-mock image response or we're in mock mode
                segment.imageUrl = imageUrl;
                segment.prompt = response.data.prompt;
              }
            }
            
            // Mark as loaded regardless of success/failure
            segment.loading = false;
            
            // Check for rate limiting
            if (response.data.rateLimited) {
              console.warn(`Rate limit reached after ${attemptsMade} attempts. Will not continue with remaining images.`);
              hitRateLimit = true;
            }
          } catch (error) {
            console.error(`Failed to generate image for segment ${i+1}:`, error);
            
            // Check if it was a rate limit error
            if (error.response?.data?.rateLimited || 
                (error.message && error.message.includes('Rate limit'))) {
              hitRateLimit = true;
            }
            
            // Mark as loaded but failed
            segment.loading = false;
            segment.fallbackUsed = true;
          } finally {
            // Mark as done processing
            segment.loading = false;
            
            // Remove this promise from the active set when done
            activePromises.delete(generatePromise);
          }
        })();
        
        // Add the promise to the active set
        activePromises.add(generatePromise);
      }
      
      // Wait for all remaining promises to finish
      while (activePromises.size > 0) {
        await Promise.race([...activePromises]);
      }
      
      return segments;
    };
    
    // Start the concurrent image generation
    await generateImageWithConcurrency(segments);
    
    // Before caching, ensure we haven't somehow exceeded the limit
    segments = segments.slice(0, LIMIT);
    
    // Log status of all segments - how many are real vs fallbacks
    const realImages = segments.filter(s => !s.fallbackUsed && !s.isMock).length;
    console.log(`Image generation complete: ${realImages}/${segments.length} real images created`);
    
    // Cache the results with the limit-aware and language-aware cache key
    imageCache[cacheKey] = {
      segments,
      timestamp: Date.now(),
      configLimit: LIMIT,
      isMock: useMockImages, // Explicitly store the mock flag
      language
    };
    saveCache();
    
    return segments;
  } catch (error) {
    console.error('Failed to generate chapter images:', error);
    // Return segments with placeholder images on error
    return segments;
  }
}

/**
 * Clear all old cache entries for a specific book/chapter/language
 * to ensure we don't mix mock and real images
 */
function clearOldCacheEntries(book, chapter, language) {
  const cacheKeysToRemove = Object.keys(imageCache).filter(key => 
    key.startsWith(`${book}-${chapter}-${language}`) &&
    !key.includes(`-limit${config.imageGeneration.maxImagesPerChapter}`)
  );
  
  if (cacheKeysToRemove.length > 0) {
    cacheKeysToRemove.forEach(key => delete imageCache[key]);
    console.log(`Cleared ${cacheKeysToRemove.length} outdated cache entries for ${book} ${chapter} in ${language}`);
    saveCache();
  }
}

/**
 * Get the appropriate image for the current verse
 * @param {Array} segments - Array of image segments with verse ranges
 * @param {number} currentVerse - Current verse number
 * @returns {Object|null} - Best matching image segment or null
 */
export function getImageForVerse(segments, currentVerse) {
  if (!segments || segments.length === 0) return null;
  
  // Ensure currentVerse is treated as a number
  const verseNum = parseInt(currentVerse);
  
  // Add more detailed logging
  console.log(`Finding image for verse ${verseNum} among ${segments.length} segments`);
  segments.forEach((segment, i) => {
    console.log(`Segment ${i+1}: verses ${segment.startVerse}-${segment.endVerse}, verse in range: ${verseNum >= segment.startVerse && verseNum <= segment.endVerse}`);
  });
  
  // Find the segment that contains this verse
  const segment = segments.find(s => 
    verseNum >= s.startVerse && verseNum <= s.endVerse
  );
  
  // Log the result
  if (segment) {
    console.log(`Found segment for verse ${verseNum}: verses ${segment.startVerse}-${segment.endVerse}`);
  } else {
    console.log(`No segment found for verse ${verseNum}, defaulting to first segment`);
  }
  
  return segment || segments[0]; // Fallback to first segment if not found
}

/**
 * Clear the cache for a specific chapter or all chapters
 * @param {string} book - Optional book to clear cache for
 * @param {number} chapter - Optional chapter to clear cache for
 * @returns {boolean} - Whether the cache was cleared
 */
export function clearImageCache(book = null, chapter = null) {
  try {
    if (book && chapter) {
      // Clear specific chapter cache - all variations
      const cacheKeysToRemove = Object.keys(imageCache).filter(key => 
        key.startsWith(`${book}-${chapter}`)
      );
      
      if (cacheKeysToRemove.length > 0) {
        cacheKeysToRemove.forEach(key => delete imageCache[key]);
        console.log(`Cleared image cache for ${book} ${chapter} (${cacheKeysToRemove.length} entries)`);
        saveCache();
        return true;
      }
      return false;
    } else {
      // Clear all chapter cache
      const oldSize = Object.keys(imageCache).length;
      imageCache = {};
      console.log(`Cleared all image cache (${oldSize} entries)`);
      saveCache();
      return true;
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

export default {
  generateChapterImages,
  analyzeChapterForImageSegments,
  getImageForVerse,
  clearImageCache
};
