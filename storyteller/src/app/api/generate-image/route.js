import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/services/mockImageService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { biblicalEvent, characters, setting, language, region } = body;
    
    // In development, use mock service
    const result = await generateImage({
      biblicalEvent,
      characters,
      setting,
      language,
      region
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
