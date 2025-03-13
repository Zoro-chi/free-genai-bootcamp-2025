import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This API would be used to read actual prompt files from the filesystem
// Note: This won't work in production environments like Vercel
// It's mainly for local development testing

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'character';
    
    // In a real server environment, we would read from the filesystem
    // But for this example, let's return mock content
    
    const mockPromptContent = {
      character: "# Character Portrait Templates for SDXL\n\n## Primary Character Template\nPortrait of [CHARACTER_NAME] with [PHYSICAL_TRAITS]...",
      scene: "# Scene Setting Templates for SDXL\n\n## Primary Scene Template\n[SCENE_NAME] set in contemporary Nigerian [REGION] environment...",
      narrative: "# Narrative Moment Templates for SDXL\n\n## Primary Narrative Template\nA [BIBLICAL_EVENT] in contemporary Nigerian [SETTING_TYPE]...",
      system: "# StoryTeller System Prompt for Image Generation\n\n## Global Style and Tone Guidelines\n\nYou are generating images for a biblical visual novel..."
    };
    
    return NextResponse.json({
      content: mockPromptContent[type] || "Prompt type not found",
      type
    });
    
  } catch (error) {
    console.error('Error reading prompt file:', error);
    return NextResponse.json(
      { error: 'Failed to read prompt file' },
      { status: 500 }
    );
  }
}
