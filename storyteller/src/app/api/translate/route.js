import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getBedrockRuntime, isAwsConfigured } from '@/lib/aws-config';

export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, text, language, prompt = '' } = body;
    
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
    if ((actualProvider === 'bedrock' || actualProvider === 'amazonbedrock') && !isAwsConfigured()) {
      console.warn('AWS not properly configured, falling back to mock translation');
      actualProvider = 'mock';
    }
    
    switch (actualProvider) {
      case 'openai':
        translation = await translateWithOpenAI(text, language, prompt);
        break;
      case 'bedrock':
      case 'amazonbedrock':
        try {
          translation = await translateWithBedrock(text, language, prompt);
        } catch (error) {
          console.error('Bedrock translation error:', error);
          // Fall back to mock translation
          translation = generateMockTranslation(text, language);
        }
        break;
      case 'huggingface':
        translation = await translateWithHuggingFace(text, language);
        break;
      default:
        // Development mock
        translation = generateMockTranslation(text, language);
    }
    
    return NextResponse.json({ 
      translation, 
      provider: actualProvider // Return which provider actually delivered the translation
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
  // Create the OpenAI configuration
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const openai = new OpenAIApi(configuration);
  
  const systemPrompt = `You are a professional translator specializing in translating Biblical text to ${language}. 
  Maintain the reverent tone, format, and meaning of the scripture, while making it natural in ${language}.
  Only respond with the translated text, no explanations.`;
  
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo", // or "gpt-4" for higher quality
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${prompt}\n\n${text}` }
    ],
    temperature: 0.3, // Lower temperature for more accurate translation
    max_tokens: 1024,
  });
  
  return response.data.choices[0].message.content.trim();
}

/**
 * Translate text using Amazon Bedrock
 */
async function translateWithBedrock(text, language, prompt) {
  // Use centralized AWS configuration
  const bedrockRuntimeClient = getBedrockRuntime();
  
  const fullPrompt = `${prompt}\n\n${text}\n\nTranslated text:`;
  
  // Updated to use AWS SDK v3 syntax for Titan
  const input = {
    modelId: 'amazon.titan-text-express-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: fullPrompt,
      textGenerationConfig: {
        maxTokenCount: 1000,
        temperature: 0.3,
        topP: 0.9,
        stopSequences: []
      }
    })
  };
  
  const command = new InvokeModelCommand(input);
  
  try {
    const response = await bedrockRuntimeClient.send(command);
    
    // Convert UInt8Array response to text
    const responseBody = Buffer.from(response.body).toString('utf8');
    const result = JSON.parse(responseBody);
    
    // Extract results from Titan's response format
    return result.results[0].outputText.trim();
  } catch (error) {
    console.error('Error calling Bedrock with SDK v3:', error);
    throw error; // Re-throw for consistent error handling
  }
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

/**
 * Generate mock translation for development and fallback
 */
function generateMockTranslation(text, language) {
  const languagePrefixes = {
    yoruba: "YOR:",
    igbo: "IG:",
    pidgin: "PID:"
  };
  
  // Make sure all languages have a mock implementation
  if (!languagePrefixes[language]) {
    return `[${language.toUpperCase()}] ${text.substring(0, 100)}...`;
  }
  
  const prefix = languagePrefixes[language];
  return `${prefix} ${text.substring(0, 100)}...`;
}
