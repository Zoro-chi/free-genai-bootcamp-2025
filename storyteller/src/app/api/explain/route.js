import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getBedrockRuntime } from '@/lib/aws-config';
import { translateText } from '@/services/translationService';
import { formatExplanation } from '@/lib/utils/explanationTemplate';

export async function POST(request) {
  try {
    const body = await request.json();
    const { book, chapter, verses, verseNumbers, language } = body;
    
    if (!verses || !verses.length) {
      return NextResponse.json(
        { error: 'No verses provided' }, 
        { status: 400 }
      );
    }
    
    // Create reference text (Book Chapter:Verse)
    const reference = `${book} ${chapter}:${verseNumbers.join(', ')}`;
    
    // Generate English explanation
    const englishExplanation = await generateExplanation(verses, reference);
    
    // If language is English, we're done
    if (language === 'english') {
      // Format the explanation using our template
      const formattedExplanation = formatExplanation(
        { englishExplanation },
        verses.map((text, i) => ({ number: verseNumbers[i], text })),
        reference,
        language
      );
      
      return NextResponse.json(formattedExplanation);
    }
    
    // Otherwise, translate the explanation
    const translatedExplanation = await translateText(englishExplanation, language);
    
    // Generate learning examples
    const examples = await generateLanguageExamples(verses, language);
    
    // Add cultural context if available
    const culturalContext = await generateCulturalContext(verses, reference, language);
    
    // Format the explanation using our template
    const formattedExplanation = formatExplanation(
      { 
        englishExplanation,
        translatedExplanation,
        examples,
        culturalContext 
      },
      verses.map((text, i) => ({ number: verseNumbers[i], text })),
      reference,
      language
    );
    
    return NextResponse.json(formattedExplanation);
    
  } catch (error) {
    console.error('Error generating explanation:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}

/**
 * Generate an explanation for the verses
 */
async function generateExplanation(verses, reference) {
  const verseText = verses.join(' ');
  
  // Use Amazon Bedrock for explanation (more cost-effective)
  const provider = process.env.NEXT_PUBLIC_TRANSLATION_PROVIDER || 'amazonbedrock';
  
  if (provider === 'openai') {
    return generateExplanationWithOpenAI(verseText, reference);
  } else {
    return generateExplanationWithBedrock(verseText, reference);
  }
}

/**
 * Generate explanation using OpenAI
 */
async function generateExplanationWithOpenAI(verseText, reference) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const openai = new OpenAIApi(configuration);
  
  const systemPrompt = `You are a biblical scholar and educator. Provide a clear, concise explanation of the verse(s) provided. 
  Focus on the meaning and significance of the text. Keep your explanation easy to understand but include theological depth.`;
  
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please explain the following Bible verse(s) from ${reference}: "${verseText}"` }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  
  return response.data.choices[0].message.content.trim();
}

/**
 * Generate explanation using Amazon Bedrock
 */
async function generateExplanationWithBedrock(verseText, reference) {
  // Use centralized AWS configuration
  const bedrockRuntimeClient = getBedrockRuntime();
  
  const prompt = `You are a biblical scholar and educator. 
  
Please provide a clear, concise explanation of the following Bible verse(s) from ${reference}:
  
"${verseText}"

Focus on the meaning and significance of the text. Your explanation should be:
- Easy to understand
- Theologically sound
- Approximately 3-5 paragraphs
- Written for someone trying to learn about the Bible

Your explanation:`;
  
  // Using Titan model with SDK v3 syntax
  const input = {
    modelId: 'amazon.titan-text-express-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 600,
        temperature: 0.7,
        topP: 0.9,
      }
    })
  };
  
  const command = new InvokeModelCommand(input);
  
  try {
    const response = await bedrockRuntimeClient.send(command);
    
    // Convert UInt8Array response to text
    const responseBody = Buffer.from(response.body).toString('utf8');
    const result = JSON.parse(responseBody);
    
    return result.results[0].outputText.trim();
  } catch (error) {
    console.error('Error calling Bedrock with SDK v3:', error);
    throw error;
  }
}

/**
 * Generate language learning examples
 */
async function generateLanguageExamples(verses, language) {
  // Extract key phrases from verses
  const verseText = verses.join(' ');
  
  // Use centralized AWS configuration
  const bedrockRuntimeClient = getBedrockRuntime();
  
  const prompt = `You are a language educator specializing in teaching ${language} to English speakers using biblical content.

Based on the following Bible verse(s):
"${verseText}"

Create 3 simple language learning examples. Each example should:
1. Illustrate a key phrase or concept from the verses
2. Be presented as an English phrase and its ${language} translation
3. Be straightforward enough for a beginner to understand
4. Be culturally appropriate

Format your response as a JSON array with this structure:
[
  {"english": "The English phrase", "translated": "The ${language} translation"},
  {"english": "Another English phrase", "translated": "Another ${language} translation"},
  {"english": "Final English phrase", "translated": "Final ${language} translation"}
]

Provide only the JSON array, no other text.`;
  
  // Using SDK v3 syntax
  const input = {
    modelId: 'amazon.titan-text-express-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 400,
        temperature: 0.7,
        topP: 0.9,
      }
    })
  };
  
  const command = new InvokeModelCommand(input);
  
  try {
    const response = await bedrockRuntimeClient.send(command);
    
    // Convert UInt8Array response to text
    const responseBody = Buffer.from(response.body).toString('utf8');
    const result = JSON.parse(responseBody);
    const output = result.results[0].outputText.trim();
    
    // Extract JSON array from the response
    const jsonMatch = output.match(/\[\s*\{.*\}\s*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no match, try parsing the whole output
    return JSON.parse(output);
  } catch (error) {
    console.error("Failed to generate language examples with SDK v3:", error);
    // Return fallback examples
    return [
      { english: "God loves you", translated: `[${language}] God loves you` },
      { english: "Jesus teaches us", translated: `[${language}] Jesus teaches us` },
      { english: "The Bible is wisdom", translated: `[${language}] The Bible is wisdom` }
    ];
  }
}

/**
 * Generate cultural context for verses
 */
async function generateCulturalContext(verses, reference, language) {
  // Use centralized AWS configuration
  const bedrockRuntimeClient = getBedrockRuntime();
  
  const prompt = `You are an expert in both biblical history and Nigerian culture.

For the following Bible verse(s) from ${reference}:
"${verses.join(' ')}"

Provide a brief cultural context that connects:
1. The original historical/cultural context of the biblical text
2. How this might relate to or be understood in Nigerian ${language} culture

Keep your response to 2-3 paragraphs. Focus on interesting and educational connections that would help someone understand both the biblical context and Nigerian cultural perspectives.`;
  
  // Using SDK v3 syntax
  const input = {
    modelId: 'amazon.titan-text-express-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 300,
        temperature: 0.7,
        topP: 0.9,
      }
    })
  };
  
  const command = new InvokeModelCommand(input);
  
  try {
    const response = await bedrockRuntimeClient.send(command);
    
    // Convert UInt8Array response to text
    const responseBody = Buffer.from(response.body).toString('utf8');
    const result = JSON.parse(responseBody);
    
    return result.results[0].outputText.trim();
  } catch (error) {
    console.error("Failed to generate cultural context with SDK v3:", error);
    return null;
  }
}
