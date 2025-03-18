/**
 * Application configuration and feature flags
 */

export const config = {
  features: {
    // Control whether real translation is enabled or mock translations are used
    realTranslation: process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION === 'true',
    
    // Control which translation provider to use
    translationProvider: process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'mock', 
  },
  
  // Language settings
  languages: {
    available: ['english', 'yoruba', 'igbo', 'pidgin'],
    default: 'english'
  },
  
  // Bible content settings
  bible: {
    defaultBook: 'Matthew',
    defaultChapter: 1
  },
  
  // Image generation settings
  imageGeneration: {
    enabled: true,
    provider: 'bedrock'
  },
  
  // Translation settings
  translation: {
    // Updated provider to Titan
    provider: process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'mock',
    bedrockModel: 'amazon.titan-text-express-v1',
    openaiModel: 'gpt-3.5-turbo'
  }
};

export default config;
