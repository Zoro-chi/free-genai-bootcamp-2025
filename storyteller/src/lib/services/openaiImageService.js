import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { config } from '@/lib/config';

// Initialize OpenAI configuration
let openai = null;

// Setup OpenAI client if API key is available
if (typeof process !== 'undefined' && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Download and save image to local file system
 * @param {string} imageUrl - Remote URL of the image
 * @param {string} imageName - Name to save the image as
 * @returns {Promise<string>} - Local path to the saved image
 */
async function saveImageLocally(imageUrl, imageName) {
  if (typeof window !== 'undefined') {
    console.log('Cannot save images on client side, skipping local save');
    return imageUrl; // Return original URL if running in browser
  }

  // Only run server-side
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const imageDir = path.join(publicDir, config.imageGeneration.localImageDir || 'generated-images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
      console.log(`Created directory: ${imageDir}`);
    }
    
    // Log full path for debugging
    console.log(`Saving image to directory: ${imageDir}`);
    
    // Generate filename with timestamp to avoid collisions
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${imageName}-${timestamp}.jpg`;
    const filePath = path.join(imageDir, filename);
    const localUrl = `${config.imageGeneration.localImageDir || '/generated-images'}/${filename}`;
    
    // Download the image
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      https.get(imageUrl, response => {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`Image saved locally: ${filePath}`);
          resolve(localUrl); // Return the local URL path
        });
      }).on('error', err => {
        fs.unlink(filePath, () => {}); // Delete the file if download failed
        console.error('Error downloading image:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error saving image locally:', error);
    return imageUrl; // Return original URL on error
  }
}

/**
 * Formats an image name based on biblical scene
 * @param {Object} scene - Scene details
 * @returns {string} - Formatted image name
 */
function formatImageName(scene) {
  const { event } = scene;
  // Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric
  return event.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50); // Limit length
}

/**
 * Generates an image using OpenAI's DALL-E 3 model
 * @param {string} prompt - The detailed image generation prompt
 * @param {string} size - Image size (default: 1024x1024)
 * @param {Object} scene - Scene details for naming saved images
 * @returns {Promise<string>} - URL of the generated image
 */
export async function generateDalleImage(prompt, size = "1024x1024", scene = null) {
  if (!openai) {
    throw new Error('OpenAI API not configured');
  }

  try {
    console.log('Generating DALL-E image with prompt:', prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: size,
      quality: "standard"
    });

    if (response && response.data && response.data[0] && response.data[0].url) {
      const imageUrl = response.data[0].url;
      
      // Log the generated image
      console.log(`✅ Generated image: ${imageUrl}`);
      
      // Save image locally if enabled
      if (config.imageGeneration.saveLocally && !process.env.DISABLE_IMAGE_SAVING) {
        try {
          const imageName = scene ? formatImageName(scene) : 'bible-scene';
          const localUrl = await saveImageLocally(imageUrl, imageName);
          return localUrl; // Return local URL if saved successfully
        } catch (saveError) {
          console.error('Failed to save image locally, using original URL:', saveError);
          return imageUrl;
        }
      }
      
      return imageUrl;
    } else {
      throw new Error('Invalid response from OpenAI');
    }
  } catch (error) {
    console.error('DALL-E image generation failed:', error);
    
    // Handle rate limit errors specifically
    if (error.status === 429) {
      console.warn('⚠️ RATE LIMIT EXCEEDED. Waiting before retrying...');
      
      // Add specific handling for rate limit errors
      const resetTimeHeader = error.headers?.['x-ratelimit-reset-images'];
      const waitTime = resetTimeHeader ? parseInt(resetTimeHeader) * 1000 : 60000;
      
      console.log(`Will retry after ${waitTime/1000} seconds`);
      
      // For now, we'll throw the error, but with better messaging
      throw new Error(`Rate limit exceeded. Please try again in ${Math.ceil(waitTime/1000)} seconds.`);
    }
    
    throw error;
  }
}

/**
 * Creates a detailed prompt for Bible scene visualization
 * that adapts to the selected language/culture
 */
export function createBiblicalImagePrompt(scene, language = 'english') {
  const { event, characters, setting, verseRange, verseContent } = scene;
  
  // Define cultural styling based on language
  const culturalStyles = {
    english: {
      style: "historically accurate, traditional biblical imagery",
      people: "people in historical Middle Eastern attire",
      setting: "traditional biblical setting"
    },
    yoruba: {
      style: "Nigerian Yoruba cultural aesthetic",
      people: "Yoruba people in traditional Nigerian attire like agbada, aso-oke, or gele headwear",
      setting: "setting adapted to Yoruba cultural context"
    },
    igbo: {
      style: "Nigerian Igbo cultural aesthetic",
      people: "Igbo people in traditional Nigerian attire like isiagu shirts, george wrapper, or ichafu caps",
      setting: "setting adapted to Igbo cultural context"
    },
    pidgin: {
      style: "contemporary Nigerian cultural aesthetic",
      people: "Nigerian people in traditional and modern Nigerian attire",
      setting: "setting adapted to Nigerian cultural context"
    }
  };
  
  // Select appropriate cultural style or default to English
  const culture = culturalStyles[language] || culturalStyles.english;
  
  // Start with main scene description
  let prompt = `Create a ${culture.style} rendering of the biblical scene: "${event}".`;
  
  // Add characters with cultural context
  if (characters && characters !== 'Biblical figures') {
    if (language === 'english') {
      prompt += ` Include the following characters: ${characters}.`;
    } else {
      prompt += ` Visualize ${characters} as ${culture.people}.`;
    }
  } else {
    // If no specific characters, use the cultural styling
    prompt += ` Feature ${culture.people}.`;
  }
  
  // Add setting with cultural context
  if (setting && setting !== 'Biblical setting') {
    if (language === 'english') {
      prompt += ` Set in ${setting}.`;
    } else {
      prompt += ` Set in ${setting}, adapted to a ${culture.setting}.`;
    }
  }
  
  // Add verse content for context if available
  if (verseContent) {
    prompt += ` The scene depicts: "${verseContent}"`;
  }
  
  // Add stylistic guidance based on culture
  if (language === 'english') {
    prompt += ` Style: Oil painting, detailed, reverent, realistic historical depiction with appropriate period clothing and setting details. Natural lighting, muted colors with warm tones.`;
  } else if (language === 'yoruba') {
    prompt += ` Style: Rich, vibrant colors with detailed patterns common in Yoruba art. Include traditional Yoruba elements like decorative adire textiles, bronze artwork, or wooden carvings where appropriate. Natural lighting that emphasizes the warm earth tones common in Yoruba visual tradition.`;
  } else if (language === 'igbo') {
    prompt += ` Style: Bold colors with Igbo artistic elements such as nsibidi symbols, uli patterns, or mbari artistic traditions where appropriate. Include traditional Igbo cultural objects and architectural elements in the setting.`;
  } else if (language === 'pidgin') {
    prompt += ` Style: Blend of traditional and contemporary Nigerian visual elements, with vibrant colors and patterns. Include recognizable Nigerian cultural elements and environments.`;
  }

  return prompt;
}

export default {
  generateDalleImage,
  createBiblicalImagePrompt,
  saveImageLocally
};
