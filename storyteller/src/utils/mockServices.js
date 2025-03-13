/**
 * Mock services for local development
 * These simulate the behavior of AWS services without requiring actual deployment
 */

// If you want to use the JSON file instead of hardcoded data
import bibleData from '../data/bibleContent.json';

// Sample image URLs for testing - replace with your own test images
const sampleImages = {
  'Jesus': 'https://placehold.co/800x800/e8c98a/fff?text=Jesus',
  'Peter': 'https://placehold.co/800x800/89b3e8/fff?text=Peter',
  'Paul': 'https://placehold.co/800x800/a8e889/fff?text=Paul',
  'Mary': 'https://placehold.co/800x800/e889b3/fff?text=Mary',
  'default': 'https://placehold.co/800x800/cccccc/333?text=Biblical+Scene'
};

// Sample scene images
const sampleSceneImages = {
  'Sermon on the Mount': 'https://placehold.co/1024x768/a8c9e8/fff?text=Sermon+on+the+Mount',
  'Last Supper': 'https://placehold.co/1024x768/e8c9a8/fff?text=Last+Supper',
  'Feeding the 5000': 'https://placehold.co/1024x768/c9e8a8/fff?text=Feeding+the+5000',
  'Creation narrative': 'https://placehold.co/1024x768/e8a8c9/fff?text=Creation+narrative',
  'default': 'https://placehold.co/1024x768/cccccc/333?text=Biblical+Scene'
};

/**
 * Mock image generation API
 * Later will be replaced with actual API calls to AWS Bedrock
 */
export const generateImage = async (params) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { biblicalEvent, characters, setting, language, region } = params;
  
  // Log what would be sent to the API
  console.log('📝 Image generation params:', {
    biblicalEvent,
    characters,
    setting,
    language,
    region,
    prompt: generateMockPrompt(params)
  });
  
  // Select appropriate sample image based on event or characters
  let imageUrl;
  
  if (biblicalEvent && sampleSceneImages[biblicalEvent]) {
    imageUrl = sampleSceneImages[biblicalEvent];
  } else if (characters) {
    // Try to find a character-specific image
    const mainCharacter = characters.split(' ')[0]; // Get first word of characters
    imageUrl = sampleImages[mainCharacter] || sampleImages.default;
  } else {
    imageUrl = sampleImages.default;
  }
  
  return {
    imageUrl,
    generationTime: "1.2s (mocked)"
  };
};

/**
 * Generates what the prompt would look like
 * This helps with testing prompt templates without API calls
 */
function generateMockPrompt(params) {
  const { biblicalEvent, characters, setting, language, region } = params;
  
  // Get appropriate template (simplified version)
  let template;
  if (biblicalEvent && biblicalEvent.includes('sermon')) {
    template = "[EVENT_NAME] featuring [CHARACTERS] in a [SETTING] environment with [REGION] cultural elements";
  } else if (characters && characters.includes('Jesus')) {
    template = "Portrait of [CHARACTERS] with Nigerian [REGION] attire in a [SETTING]";
  } else {
    template = "A biblical scene of [EVENT_NAME] with [CHARACTERS] in [REGION] setting";
  }
  
  // Simple template replacement
  return template
    .replace('[EVENT_NAME]', biblicalEvent || 'biblical event')
    .replace('[CHARACTERS]', characters || 'biblical characters')
    .replace('[SETTING]', setting || 'Nigerian community')
    .replace('[REGION]', region || 'Yoruba');
}

/**
 * Mock Bible API
 * Later will be replaced with an actual Bible API service
 */
export const fetchBibleContent = async (book, chapter, language) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Create key for data lookup
  const dataKey = `${book}-${chapter}-${language}`;
  
  // Return data if exists in imported JSON
  if (bibleData[dataKey]) {
    return bibleData[dataKey];
  }
  
  // Default fallback data
  return {
    book,
    chapter,
    verses: [
      { number: 1, text: "Sample verse 1 for " + book + " chapter " + chapter },
      { number: 2, text: "Sample verse 2 for " + book + " chapter " + chapter },
      { number: 3, text: "Sample verse 3 for " + book + " chapter " + chapter }
    ],
    keyScenes: [
      {
        verseRange: [1, 3],
        event: "Unknown biblical event",
        characters: "Biblical characters",
        setting: "Biblical setting"
      }
    ]
  };
};
