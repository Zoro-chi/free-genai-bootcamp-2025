import axios from 'axios';
import { config } from '@/lib/config';
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getBedrockRuntime, isAwsConfigured } from '@/lib/aws-config';

/**
 * Service for translating Bible verses to Nigerian languages
 * Uses a configurable translation provider
 */

// Translation cache to avoid repeated API calls
const translationCache = {
  yoruba: {},  // { verseKey: translatedText }
  igbo: {},
  pidgin: {}
};

// Helper to determine if we're running on the server
const isServer = typeof window === 'undefined';

// Get the base URL for API calls depending on environment
function getBaseUrl() {
  if (!isServer) {
    // Browser side - use relative URLs
    return '';
  }
  
  // Server side - need absolute URLs
  // Use NEXT_PUBLIC_API_URL if defined in environment variables
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback to localhost during development/testing
  return process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com' // Replace with your actual production domain
    : 'http://localhost:3000';
}

/**
 * Translate text to a target Nigerian language
 * @param {string} text - Text to translate
 * @param {string} language - Target language (yoruba, igbo, pidgin)
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, language) {
  // Normalize language name
  const normalizedLanguage = language.toLowerCase();
  
  // Skip translation for English
  if (normalizedLanguage === 'english') {
    return text;
  }
  
  // Generate a cache key for this text
  const cacheKey = `${text.substring(0, 50)}`;
  
  // Explicitly force environment variable check - bypassing any cached config
  const useRealTranslation = process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION === 'true';
  const forcedProvider = process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'mock';
  
  console.log(`Translation settings - Using real translation: ${useRealTranslation}, Provider: ${forcedProvider}`);
  
  // Check cache first
  if (translationCache[normalizedLanguage] && 
      translationCache[normalizedLanguage][cacheKey]) {
    console.log('Using cached translation');
    return translationCache[normalizedLanguage][cacheKey];
  }

  try {
    let translatedText = '';
    
    // If real translation is disabled, use mock regardless of other settings
    if (!useRealTranslation) {
      console.log('🔄 Using mock translation (real translation disabled)');
      translatedText = generateMockTranslation(text, normalizedLanguage);
    } else {
      // Otherwise, use the configured provider
      console.log(`🔄 Using real translation with provider: ${forcedProvider}`);
      
      switch (forcedProvider) {
        case 'openai':
          translatedText = await translateWithOpenAI(text, normalizedLanguage);
          break;
        case 'amazonbedrock':
          translatedText = await translateWithAmazonBedrock(text, normalizedLanguage);
          break;
        case 'huggingface':
          translatedText = await translateWithHuggingFace(text, normalizedLanguage);
          break;
        default:
          // Fallback to mock if provider is unknown
          console.log('⚠️ Unknown provider, falling back to mock');
          translatedText = generateMockTranslation(text, normalizedLanguage);
      }
    }

    // Save to cache
    if (!translationCache[normalizedLanguage]) {
      translationCache[normalizedLanguage] = {};
    }
    translationCache[normalizedLanguage][cacheKey] = translatedText;
    
    return translatedText;
  } catch (error) {
    console.error(`Translation error (${language}):`, error);
    // Return a marked-up version of the original text as fallback
    return `[${language}] ${text}`;
  }
}

/**
 * Translate text using OpenAI's API
 */
async function translateWithOpenAI(text, language) {
  const languagePrompts = {
    yoruba: "Translate the following Bible verse to Yoruba, maintaining the reverent and sacred tone:",
    igbo: "Translate the following Bible verse to Igbo, maintaining the reverent and sacred tone:",
    pidgin: "Translate the following Bible verse to Nigerian Pidgin English, maintaining the reverent and sacred tone:"
  };
  
  const prompt = languagePrompts[language] || `Translate to ${language}:`;
  
  const baseUrl = getBaseUrl();
  const response = await axios.post(`${baseUrl}/api/translate`, {
    provider: 'openai',
    text,
    language,
    prompt
  });
  
  return response.data.translation;
}

/**
 * Translate text using Amazon Bedrock
 */
async function translateWithAmazonBedrock(text, language) {
  // Check if AWS is configured before making API calls
  if (!isAwsConfigured()) {
    console.log('🔄 AWS credentials not configured, falling back to mock translation');
    return generateMockTranslation(text, language);
  }

  const languagePrompts = {
    yoruba: "Translate the following Bible verse to Yoruba, maintaining the reverent and sacred tone:",
    igbo: "Translate the following Bible verse to Igbo, maintaining the reverent and sacred tone:",
    pidgin: "Translate the following Bible verse to Nigerian Pidgin English, maintaining the reverent and sacred tone:"
  };
  
  // Enhanced prompting for Titan model to improve translation quality
  const prompt = `You are translating biblical text from English to ${language}.
${languagePrompts[language] || `Translate to ${language}:`}

The English text is:
"${text}"

Translated ${language} text:`;
  
  try {
    const baseUrl = getBaseUrl();
    const response = await axios.post(`${baseUrl}/api/translate`, {
      provider: 'bedrock',
      text,
      language,
      prompt
    });
    
    return response.data.translation;
  } catch (error) {
    console.error(`🔄 Bedrock API call failed: ${error.message}`);
    // Fall back to mock translation
    return generateMockTranslation(text, language);
  }
}

/**
 * Direct translation using Bedrock without going through API
 * For server-side use only
 */
export async function directTranslateWithBedrock(text, language) {
  if (!text || language === 'english') return text;
  
  // Check if AWS is configured before attempting direct call
  if (!isAwsConfigured()) {
    console.log('🔄 AWS credentials not configured, falling back to mock translation');
    return generateMockTranslation(text, language);
  }
  
  try {
    const bedrockRuntimeClient = getBedrockRuntime();
    
    const languagePrompt = `Translate the following text from English to ${language}, maintaining the tone and meaning:
    
    "${text}"
    
    ${language} translation:`;
    
    // Using SDK v3 syntax
    const input = {
      modelId: 'amazon.titan-text-express-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: languagePrompt,
        textGenerationConfig: {
          maxTokenCount: Math.max(300, text.length * 2), // Allocate sufficient tokens
          temperature: 0.2,
          topP: 0.9,
        }
      })
    };
    
    const command = new InvokeModelCommand(input);
    const response = await bedrockRuntimeClient.send(command);
    
    // Convert UInt8Array response to text
    const responseBody = Buffer.from(response.body).toString('utf8');
    const result = JSON.parse(responseBody);
    
    return result.results[0].outputText.trim();
  } catch (error) {
    console.error('Direct Bedrock translation error with SDK v3:', error);
    return generateMockTranslation(text, language);
  }
}

/**
 * Translate text using Hugging Face models
 */
async function translateWithHuggingFace(text, language) {
  const baseUrl = getBaseUrl();
  const response = await axios.post(`${baseUrl}/api/translate`, {
    provider: 'huggingface',
    text,
    language
  });
  
  return response.data.translation;
}

/**
 * Generate mock translation for development
 * (Replace this with actual API calls in production)
 */
function generateMockTranslation(text, language) {
  const languagePrefixes = {
    yoruba: "YOR:",
    igbo: "IG:",
    pidgin: "PID:"
  };
  
  // Make sure all languages have a mock implementation
  if (!languagePrefixes[language]) {
    console.warn(`No mock translation prefix defined for language: ${language}`);
    return `[${language.toUpperCase()}] ${text.substring(0, 50)}...`;
  }
  
  const prefix = languagePrefixes[language];
  return `${prefix} ${text.substring(0, 50)}...`;
}

/**
 * Translate a full set of verses
 * @param {Array} verses - Array of verse objects with number and text properties
 * @param {string} language - Target language
 * @returns {Promise<Array>} - Array of translated verse objects
 */
export async function translateVerses(verses, language) {
  if (language === 'english') return verses;
  
  // Process verses in batches to avoid rate limits
  const batchSize = 5;
  const result = [...verses]; // Clone array
  
  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    const translations = await Promise.all(
      batch.map(verse => translateText(verse.text, language))
    );
    
    translations.forEach((translatedText, index) => {
      result[i + index] = {
        ...result[i + index],
        text: translatedText
      };
    });
  }
  
  return result;
}

// Add a hybrid approach that chooses the best model for each language
export async function getOptimalProvider(language) {
  switch(language.toLowerCase()) {
    case 'yoruba':
      // Use Titan model for Yoruba
      return 'bedrock';
    case 'igbo':
      // Use Titan model for Igbo
      return 'bedrock';
    case 'pidgin':
      // Use Titan model for Nigerian Pidgin
      return 'bedrock';
    default:
      // Default provider from config
      return process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'bedrock';
  }
}

export default {
  translateText,
  translateVerses
};
