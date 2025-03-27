import { config } from '@/lib/config';

/**
 * Utility service for Amazon Bedrock model interactions
 */

// Import AWS SDK - conditionally to avoid client-side issues
let InvokeModelCommand;
let getBedrockRuntime;
let isAwsConfigured;

// Try to import AWS-related functions
try {
  const awsModule = require('@/lib/aws-config');
  if (awsModule) {
    ({ getBedrockRuntime, isAwsConfigured } = awsModule);
    const { InvokeModelCommand: IMC } = require("@aws-sdk/client-bedrock-runtime");
    InvokeModelCommand = IMC;
  }
} catch (error) {
  console.log('AWS integration not available, will use mock');
}

/**
 * Formats the request body based on model type
 */
export function formatRequestBody(modelId, prompt, text) {
  if (modelId.includes('claude')) {
    // Claude model request format
    return {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: Math.max(300, text.length * 2),
      temperature: 0.2,
      system: `You are a translation expert specializing in African languages, particularly Nigerian languages.`,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };
  } else if (modelId.includes('nova')) {
    // Nova model request format - updated with correct array format for content
    return {
      messages: [
        {
          role: "user",
          content: [{ text: prompt }]  // Content must be an array with a text object
        }
      ]
    };
  } else {
    // Titan and other models format
    return {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: Math.max(300, text.length * 2),
        temperature: 0.2,
        topP: 0.9,
      }
    };
  }
}

/**
 * Clean the translation output from various models to extract just the translated text
 * @param {string} text - The raw output from the model
 * @return {string} The cleaned translation
 */
function cleanTranslationOutput(text) {
  if (!text) return '';
  
  // Check if text contains newlines - typical in Nova Lite responses
  if (text.includes('\n')) {
    // Split by newlines and get the last non-empty segment
    const segments = text.split('\n').filter(segment => segment.trim());
    if (segments.length > 1) {
      // Return the last segment which typically contains just the translation
      return cleanupTranslationText(segments[segments.length - 1].trim());
    }
  }
  
  // For cases without newlines or as fallback
  return cleanupTranslationText(text);
}

/**
 * Helper function to clean up common patterns in translations
 */
function cleanupTranslationText(text) {
  return text
    // Remove "Here's the translation..." or "Sure, here is the translation..." patterns
    .replace(/^(sure,?\s*)?(here'?s?( is)?|this is) (the )?translation( of [^:]*)?:?\s*/i, '')
    // Remove "Translated [language] text:" pattern
    .replace(/^translated (into |to )?[a-z]+ text:?\s*/i, '')
    // Remove "[Language] translation:" pattern
    .replace(/^[a-z]+ translation:?\s*/i, '')
    // Remove "This translation maintains..." pattern
    .replace(/^this translation maintains [^.]*\.\s*/i, '')
    // Remove quotation marks that wrap the entire text
    .replace(/^["'](.+)["']$/s, '$1')
    // Remove any initial colons that might remain
    .replace(/^:\s*/, '')
    .trim();
}

/**
 * Parses the response body based on model type
 */
export function parseResponseBody(modelId, responseBody) {
  const result = JSON.parse(responseBody);
  
  // Add debug logging to inspect the actual response structure only in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Response from model ${modelId}:`, JSON.stringify(result, null, 2));
  }
  
  let extractedText = '';
  
  if (modelId.includes('claude')) {
    // Claude model response format
    extractedText = result.content[0].text.trim();
  } else if (modelId.includes('nova')) {
    // Nova model response format - extract just the translated text
    try {
      // Extract the actual text from the Nova response structure
      if (result.output && result.output.message && result.output.message.content) {
        // This is the specific format from the example response
        extractedText = result.output.message.content[0].text.trim();
      } else if (result.generation) {
        extractedText = result.generation.trim();
      } else if (result.completion) {
        extractedText = result.completion.trim(); 
      } else if (result.choices && result.choices[0]) {
        if (result.choices[0].message && result.choices[0].message.content) {
          extractedText = result.choices[0].message.content.trim();
        } else if (result.choices[0].text) {
          extractedText = result.choices[0].text.trim();
        }
      } else if (result.results && result.results[0] && result.results[0].outputText) {
        extractedText = result.results[0].outputText.trim();
      } else {
        // If none of the above formats match, return the raw response for debugging
        console.warn('Could not extract text from Nova response, returning full response');
        return JSON.stringify(result);
      }
    } catch (error) {
      console.error('Error parsing Nova response:', error);
      console.error('Raw response:', responseBody);
      throw new Error(`Failed to parse Nova response: ${error.message}`);
    }
  } else {
    // Titan and other models
    extractedText = result.results[0].outputText.trim();
  }
  
  // Clean the extracted text to remove prefatory phrases
  return cleanTranslationOutput(extractedText);
}

/**
 * Creates a translation prompt
 */
export function createTranslationPrompt(text, targetLanguage, sourceLanguage) {
  const languagePrompts = {
    yoruba: "Translate the following Bible verse to Yoruba, maintaining the reverent and sacred tone:",
    igbo: "Translate the following Bible verse to Igbo, maintaining the reverent and sacred tone:",
    pidgin: "Translate the following Bible verse to Nigerian Pidgin English, maintaining the reverent and sacred tone:",
    hausa: "Translate the following Bible verse to Hausa, maintaining the reverent and sacred tone:"
  };
  
  return `You are translating biblical text from ${sourceLanguage} to ${targetLanguage}.
${languagePrompts[targetLanguage] || `Translate to ${targetLanguage}:`}

The ${sourceLanguage} text is:
"${text}"

Translated ${targetLanguage} text:`;
}

/**
 * Attempts translation using multiple Bedrock models with fallback
 */
export async function translateWithBedrockModels(bedrockClient, prompt, text) {
  if (!isAwsConfigured || !isAwsConfigured() || !bedrockClient || !InvokeModelCommand) {
    throw new Error('AWS credentials or SDK not configured');
  }
  
  // Get models from config
  const primaryModelId = config?.translation?.bedrockModel || 'amazon.nova-lite-v1:0';
  const fallbackModels = config?.translation?.bedrockFallbackModels || ['amazon.titan-text-express-v1'];
  const allModels = [primaryModelId, ...fallbackModels];
  
  let lastError = null;
  
  // Try each model in sequence
  for (const modelId of allModels) {
    try {
      console.log(`🔄 Attempting translation with model: ${modelId}`);
      
      const requestBody = formatRequestBody(modelId, prompt, text);
      
      const input = {
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody)
      };
      
      const command = new InvokeModelCommand(input);
      const response = await bedrockClient.send(command);
      const responseBody = Buffer.from(response.body).toString('utf8');
      
      return parseResponseBody(modelId, responseBody);
    } catch (modelError) {
      console.warn(`⚠️ Model ${modelId} failed:`, modelError.message);
      lastError = modelError;
      continue;
    }
  }
  
  // If we get here, all models failed
  throw new Error(`All translation models failed. Last error: ${lastError?.message}`);
}

/**
 * Generate mock translation for development/fallback
 */
export function generateMockTranslation(text, language) {
  const languagePrefixes = {
    yoruba: "[YORUBA] ",
    igbo: "[IGBO] ",
    pidgin: "[PIDGIN] ",
    hausa: "[HAUSA] "
  };
  
  const prefix = languagePrefixes[language.toLowerCase()] || `[${language.toUpperCase()}] `;
  return `${prefix}${text}`;
}

/**
 * Check if AWS Bedrock is properly configured
 */
export function checkBedrockConfig() {
  return isAwsConfigured && isAwsConfigured();
}

/**
 * Get the Bedrock runtime client
 */
export function getBedrockClient() {
  return getBedrockRuntime ? getBedrockRuntime() : null;
}

export default {
  translateWithBedrockModels,
  createTranslationPrompt,
  generateMockTranslation,
  checkBedrockConfig,
  getBedrockClient
};
