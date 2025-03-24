import { NextResponse } from 'next/server';
import { generateDalleImage, createBiblicalImagePrompt } from '@/services/openaiImageService';
import { config } from '@/lib/config';

// Track API requests for rate limiting
const apiRequestTracker = {
  lastResetTime: Date.now(),
  requestCount: 0,
  
  // Reset counter every minute
  checkAndReset() {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.lastResetTime = now;
      this.requestCount = 0;
      console.log('API request tracker reset');
    }
  },
  
  // Add a request to the counter
  addRequest() {
    this.checkAndReset();
    this.requestCount++;
    return this.requestCount;
  },
  
  // Check if we're over the limit
  isOverLimit(limit = 5) {
    this.checkAndReset();
    return this.requestCount >= limit;
  }
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      biblicalEvent, 
      characters, 
      setting, 
      verseContent, 
      language = 'english',
      provider = config.imageGeneration.provider || 'openai',
      forceRefresh = false,
      bypassMock = false
    } = body;
    
    if (!biblicalEvent) {
      return NextResponse.json({ error: 'Missing scene information' }, { status: 400 });
    }
    
    // Create the scene and prompt (needed regardless of mock mode)
    const scene = {
      event: biblicalEvent,
      characters,
      setting,
      verseContent
    };
    
    // Pass language to prompt creation
    const prompt = createBiblicalImagePrompt(scene, language);
    
    // Check for mock mode - prioritize API call parameter, then environment variable, then config
    const envMockValue = process.env.NEXT_PUBLIC_USE_MOCK_IMAGES;
    const envUsesMock = envMockValue === 'true';
    const envDisablesMock = envMockValue === 'false';
    
    // If bypassMock is true, always use real images regardless of config
    const useMockImages = bypassMock ? false : 
                        (envDisablesMock ? false : 
                        (envUsesMock || config.imageGeneration.useMockImages));
    
    console.log(`Image generation mode: ${useMockImages ? 'MOCK' : 'REAL'} (env: ${envMockValue}, config: ${config.imageGeneration.useMockImages}, bypass: ${bypassMock})`);
    
    // Always use placeholders in mock mode
    if (useMockImages) {
      const placeholderIndex = Math.floor(Math.random() * (config.imageGeneration.mockImageCount || 5)) + 1;
      const placeholderDir = config.imageGeneration.mockImageDir || '/images/placeholders';
      
      return NextResponse.json({ 
        imageUrl: `${placeholderDir}/${placeholderIndex}.jpg`,
        prompt,
        isMock: true
      });
    }
    
    // Check for rate limiting - but skip check if forceRefresh is true
    if (apiRequestTracker.isOverLimit(5) && !forceRefresh) {
      console.warn('Rate limit prevention triggered, using placeholder image');
      const placeholderIndex = Math.floor(Math.random() * config.imageGeneration.mockImageCount) + 1;
      const placeholderDir = config.imageGeneration.mockImageDir || '/images/placeholders';
      
      return NextResponse.json({ 
        imageUrl: `${placeholderDir}/${placeholderIndex}.jpg`,
        prompt,
        rateLimited: true,
        retryAfter: 60,
        isMock: true // Explicitly mark as mock so the client knows
      });
    }
    
    // Track the request
    apiRequestTracker.addRequest();
    
    // Generate real image with DALL-E
    let imageUrl = '';
    let isMockFallback = false;
    
    try {
      // Only attempt real generation if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      
      // Pass language to image generation for cultural context
      imageUrl = await generateDalleImage(prompt, config.imageGeneration.imageSize, scene, language);
    } catch (error) {
      console.error('Image generation error:', error);
      
      // On any error, fall back to a placeholder
      const placeholderIndex = Math.floor(Math.random() * config.imageGeneration.mockImageCount) + 1;
      const placeholderDir = config.imageGeneration.mockImageDir || '/images/placeholders';
      imageUrl = `${placeholderDir}/${placeholderIndex}.jpg`;
      isMockFallback = true;
      
      // Add rate limit specific info if applicable
      if (error.message && error.message.includes('Rate limit')) {
        return NextResponse.json({ 
          imageUrl,
          prompt,
          rateLimited: true,
          error: error.message,
          isMock: true // Explicitly mark as mock
        });
      }
    }
    
    return NextResponse.json({ 
      imageUrl, 
      prompt,
      isMock: isMockFallback // Explicitly indicate if this is a mock fallback
    });
  } catch (error) {
    console.error('Error in image generation:', error);
    
    // Always return a valid response even on error
    const placeholderIndex = Math.floor(Math.random() * config.imageGeneration.mockImageCount) + 1;
    const placeholderDir = config.imageGeneration.mockImageDir || '/images/placeholders';
    
    return NextResponse.json({ 
      imageUrl: `${placeholderDir}/${placeholderIndex}.jpg`,
      error: error.message,
      usingFallback: true
    });
  }
}
