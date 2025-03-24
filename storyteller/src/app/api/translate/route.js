import { NextResponse } from 'next/server';
import OpenAI from 'openai'; // Updated import for v4 SDK
import bedrockService from '@/services/bedrockService';
import { config } from '@/lib/config';

export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, text, language, sourceLanguage = 'english', prompt = '' } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }
    
    let translation = '';
    
    // Check if the requested provider is available
    const requestedProvider = provider || 'bedrock';
    let actualProvider = requestedProvider;
    
    // Force mock for Bedrock if not configured
    if ((actualProvider === 'bedrock' || actualProvider === 'amazonbedrock') && !bedrockService.checkBedrockConfig()) {
      console.warn('AWS not properly configured, falling back to mock translation');
      actualProvider = 'mock';
    }
    
    // Log the translation request
    console.log(`Translation request: ${actualProvider} for ${language}, text length: ${text.length}`);
    
    switch (actualProvider) {
      case 'openai':
        translation = await translateWithOpenAI(text, language, prompt);
        break;
      case 'bedrock':
      case 'amazonbedrock':
        try {
          const translationPrompt = prompt || bedrockService.createTranslationPrompt(text, language, sourceLanguage);
          const bedrockClient = bedrockService.getBedrockClient();
          
          if (bedrockClient) {
            translation = await bedrockService.translateWithBedrockModels(bedrockClient, translationPrompt, text);
          } else {
            throw new Error('Bedrock client not initialized');
          }
        } catch (error) {
          console.error('Bedrock translation error:', error);
          // Fall back to mock translation
          translation = bedrockService.generateMockTranslation(text, language);
        }
        break;
      case 'huggingface':
        translation = await translateWithHuggingFace(text, language);
        break;
      default:
        // Development mock
        translation = bedrockService.generateMockTranslation(text, language);
    }
    
    return NextResponse.json({ 
      translation, 
      provider: actualProvider,
      sourceLanguage,
      targetLanguage: language
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to translate text',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Translate text using OpenAI API
 */
async function translateWithOpenAI(text, language, prompt) {
  // Create OpenAI client with v4 SDK pattern
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const systemPrompt = `You are a professional translator specializing in translating Biblical text to ${language}. 
  Maintain the reverent tone, format, and meaning of the scripture, while making it natural in ${language}.
  Your translation should be concise and similar in length to the original input text.
  Never repeat phrases or get stuck in loops. Limit your response to a direct translation.
  Only respond with the translated text, no explanations.`;
  
  const response = await openai.chat.completions.create({
    model: config?.translation?.openaiModel || "gpt-3.5-turbo", 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${prompt}\n\n${text}` }
    ],
    temperature: 0.3, // Lower temperature for more accurate translation
    max_tokens: Math.min(text.length * 4, 500), // Limit token output to prevent repetition loops
    frequency_penalty: 1.0, // Discourage repetition
  });
  
  return response.choices[0].message.content.trim();
}

/**
 * Translate text using Hugging Face models
 * Uses specific models for Nigerian languages
 */
async function translateWithHuggingFace(text, language) {
  // This would require setting up a Hugging Face API client
  // For now, we'll use a mock implementation
  return `[${language.toUpperCase()} via HF] ${text.substring(0, 100)}`;
}
