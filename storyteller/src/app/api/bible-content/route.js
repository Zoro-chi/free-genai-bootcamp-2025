import { NextResponse } from 'next/server';
import { fetchBibleContent } from '@/lib/services/mockBibleService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const language = searchParams.get('language') || 'english';
  
  if (!book || !chapter) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  
  try {
    // Use mock service in development
    const result = await fetchBibleContent(
      book, 
      parseInt(chapter), 
      language
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Bible content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Bible content' },
      { status: 500 }
    );
  }
}
