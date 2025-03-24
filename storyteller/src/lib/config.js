/**
 * Application configuration and feature flags
 */

export const config = {
  features: {
    // Control whether real translation is enabled or mock translations are used
    realTranslation: process.env.NEXT_PUBLIC_ENABLE_REAL_TRANSLATION === 'true',
    
    // Control which translation provider to use
    translationProvider: process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'mock',
    
    // Enable dark mode
    darkMode: true,
    
    // Enable bookmarking
    bookmarking: true
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
    provider: 'openai',
    maxImagesPerChapter: 3, // Explicitly set to 5 (not changed, just highlighting)
    imageSize: '1024x1024',
    transitionDuration: 500, // ms for image transitions
    cacheTTL: 30, // days to keep images in cache
    saveLocally: true, // Add flag to save images locally
    localImageDir: '/generated-images', // Directory in public folder to save images
    // More explicit handling of mock images env variable
    useMockImages: typeof process !== 'undefined' ? 
      (process.env.NEXT_PUBLIC_USE_MOCK_IMAGES === 'true' || false) : false,
    mockImageDir: '/images/placeholders', // Directory for placeholder images
    mockImageCount: 5 // Number of available placeholder images (1.jpg through 5.jpg)
  },
  
  // Translation settings
  translation: {
    // Updated provider to Claude for Nigerian languages
    provider: process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'mock',
    // Updated to use Amazon Nova Lite as primary model
    bedrockModel: 'amazon.nova-lite-v1:0', // Changed from Claude 3 Haiku to Nova Lite
    bedrockFallbackModels: [
      'amazon.titan-text-express-v1' // Titan as last resort
    ],
    openaiModel: 'gpt-3.5-turbo'
  },
  
  // Theme settings
  theme: {
    default: 'light',
    options: [
      {
        id: 'light',
        name: 'Light',
        icon: 'sun',
        colors: {
          background: '#f5f1e6',
          paper: '#ffffff',
          text: '#3a3224',
          primary: '#1e3a8a',
          secondary: '#d4af37',
          accent: '#d2b48c'
        }
      },
      {
        id: 'dark',
        name: 'Dark',
        icon: 'moon',
        colors: {
          background: '#121212',
          paper: '#1e1e1e',
          text: '#e0e0e0',
          primary: '#90caf9',
          secondary: '#f1c40f',
          accent: '#a67c52'
        }
      },
      {
        id: 'sepia',
        name: 'Sepia',
        icon: 'book',
        colors: {
          background: '#f4ecd8',
          paper: '#fbf7ef',
          text: '#5b4636',
          primary: '#8b4513',
          secondary: '#cd7f32',
          accent: '#b38b6d'
        }
      }
    ]
  }
};

export default config;
