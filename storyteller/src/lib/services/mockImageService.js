/**
 * Mock Image Generation Service
 * Simulates AI image generation for development without API costs
 */

// Sample images for specific characters
const characterImages = {
  'Jesus': [
    'https://placehold.co/800x800/e8c98a/fff?text=Jesus+Portrait+1',
    'https://placehold.co/800x800/e8d79a/fff?text=Jesus+Portrait+2',
  ],
  'Peter': [
    'https://placehold.co/800x800/89b3e8/fff?text=Peter+Portrait',
  ],
  'Paul': [
    'https://placehold.co/800x800/a8e889/fff?text=Paul+Portrait',
  ],
  'Mary': [
    'https://placehold.co/800x800/e889b3/fff?text=Mary+Portrait',
  ],
  'John': [
    'https://placehold.co/800x800/b389e8/fff?text=John+Portrait',
  ],
};

// Sample images for specific scenes
const sceneImages = {
  'Sermon on the Mount': [
    'https://placehold.co/1024x768/a8c9e8/fff?text=Sermon+on+the+Mount+1',
    'https://placehold.co/1024x768/98b9d8/fff?text=Sermon+on+the+Mount+2',
  ],
  'Last Supper': [
    'https://placehold.co/1024x768/e8c9a8/fff?text=Last+Supper',
  ],
  'Feeding the 5000': [
    'https://placehold.co/1024x768/c9e8a8/fff?text=Feeding+5000',
  ],
  'Creation narrative': [
    'https://placehold.co/1024x768/e8a8c9/fff?text=Creation+narrative',
  ],
  'Healing': [
    'https://placehold.co/1024x768/a8e8c9/fff?text=Healing+Scene',
  ],
  'Crucifixion': [
    'https://placehold.co/1024x768/d8d8d8/fff?text=Crucifixion',
  ],
  'Resurrection': [
    'https://placehold.co/1024x768/f8f8a8/fff?text=Resurrection',
  ],
};

// Default images for when no specific match is found
const defaultImages = {
  scene: 'https://placehold.co/1024x768/cccccc/333?text=Biblical+Scene',
  character: 'https://placehold.co/800x800/cccccc/333?text=Character+Portrait',
};

/**
 * Mock image generation for development
 * @param {Object} params - Image generation parameters
 * @returns {Promise<Object>} - Generated image URL and metadata
 */
export const generateImage = async (params) => {
  // Simulate network delay and processing time
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const { biblicalEvent, characters, setting, language, region } = params;
  
  console.log('🔍 Generating image with params:', { biblicalEvent, characters, setting, language, region });
  console.log('📝 Mock prompt:', generateMockPrompt(params));
  
  // Determine if we're generating a character portrait or a scene
  const isCharacterPortrait = !biblicalEvent && characters && characters.split(' ').length === 1;
  
  // Choose appropriate image
  let imageUrl;
  
  if (isCharacterPortrait) {
    // Find character image
    const character = characters.trim();
    const characterImageArray = characterImages[character];
    if (characterImageArray && characterImageArray.length > 0) {
      // Pick random image from available options
      imageUrl = characterImageArray[Math.floor(Math.random() * characterImageArray.length)];
    } else {
      imageUrl = defaultImages.character;
    }
  } else {
    // Find scene image
    let eventKey = null;
    
    // Try to match the biblical event with our available scenes
    if (biblicalEvent) {
      // Check for exact match
      if (sceneImages[biblicalEvent]) {
        eventKey = biblicalEvent;
      } else {
        // Check for partial matches
        for (const key of Object.keys(sceneImages)) {
          if (biblicalEvent.toLowerCase().includes(key.toLowerCase()) || 
              key.toLowerCase().includes(biblicalEvent.toLowerCase())) {
            eventKey = key;
            break;
          }
        }
      }
    }
    
    // If we found a matching event, use its images
    if (eventKey && sceneImages[eventKey]) {
      const sceneImageArray = sceneImages[eventKey];
      imageUrl = sceneImageArray[Math.floor(Math.random() * sceneImageArray.length)];
    } else {
      imageUrl = defaultImages.scene;
    }
  }
  
  // Generate mock metadata
  return {
    imageUrl,
    generationTime: `${(Math.random() * 2 + 1).toFixed(1)}s (mocked)`,
    prompt: generateMockPrompt(params),
    model: 'SDXL 1.0 (mocked)',
    dimensions: isCharacterPortrait ? '768x768' : '1024x1024'
  };
};

/**
 * Generate a mock prompt that would be sent to the AI
 * @param {Object} params - Image parameters
 * @returns {string} - The constructed prompt
 */
function generateMockPrompt(params) {
  const { biblicalEvent, characters, setting, language, region } = params;
  
  // Base system prompt
  const systemPrompt = "Create photorealistic image with cinematic composition that balances biblical accuracy with contemporary Nigerian cultural elements.";
  
  // Select template based on content
  let template;
  if (!biblicalEvent && characters && characters.split(' ').length === 1) {
    // Character portrait
    template = "Portrait of [CHARACTERS] with [PHYSICAL_TRAITS] in contemporary Nigerian [REGION] attire, [EMOTION] expression, detailed cultural elements including traditional accessories, photorealistic, professional photography style";
  } else if (biblicalEvent && biblicalEvent.toLowerCase().includes('sermon')) {
    // Teaching scene
    template = "[EVENT_NAME] set in contemporary Nigerian [REGION] environment, featuring [CHARACTERS] teaching followers, afternoon with golden sunlight, inspirational atmosphere, cultural elements including traditional fabrics and carved wooden seating, photorealistic";
  } else if (biblicalEvent && (biblicalEvent.toLowerCase().includes('healing') || biblicalEvent.toLowerCase().includes('miracle'))) {
    // Healing/miracle scene
    template = "A [EVENT_NAME] in contemporary Nigerian [SETTING], featuring [CHARACTERS] with expressions of compassion, morning light with dramatic rays, witnesses showing amazement and joy, detailed cultural elements including architectural details with traditional patterns, photorealistic";
  } else {
    // General scene
    template = "A biblical scene of [EVENT_NAME] featuring [CHARACTERS] in contemporary Nigerian [REGION] setting, [SETTING_DETAILS], photorealistic with cultural adaptation";
  }
  
  // Fill in the template with actual values
  let prompt = template
    .replace('[EVENT_NAME]', biblicalEvent || 'biblical event')
    .replace('[CHARACTERS]', characters || 'biblical characters')
    .replace('[SETTING]', setting || 'community center')
    .replace('[REGION]', region || 'Yoruba')
    .replace('[SETTING_DETAILS]', setting || 'community gathering')
    .replace('[PHYSICAL_TRAITS]', 'distinctive features')
    .replace('[EMOTION]', 'serene');
  
  // Add system prompt
  return `${systemPrompt} ${prompt}, high quality photograph, professional lighting`;
}

export default {
  generateImage
};