const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { biblicalEvent, characters, setting, language, region } = body;
    
    // Create appropriate prompt using the templates
    const prompt = generatePrompt(biblicalEvent, characters, setting, language, region);
    
    // Set up Bedrock client
    const bedrockRuntime = new AWS.BedrockRuntime();
    
    // Call Bedrock with the constructed prompt using Amazon Nova Canvas
    const response = await bedrockRuntime.invokeModel({
      modelId: 'amazon.titan-image-generator-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        taskType: "TEXT_IMAGE",
        textToImageParams: {
          text: prompt,
          negativeText: "blurry, distorted, low quality, cartoon, deformed faces, unrealistic features, poor anatomy, bad proportions, watermark, signature, oversaturated, text, writing, unnatural lighting, digital art style, illustration, painting",
          height: 1024,
          width: 1024,
          numberOfImages: 1,
          cfgScale: 8.0,
          seed: Math.floor(Math.random() * 1000000)
        },
        imageGenerationConfig: {
          quality: "standard",
          checkpointFrequency: 0
        }
      })
    }).promise();
    
    // Parse the response
    const responseBody = JSON.parse(response.body);
    
    // In a real implementation, you would:
    // 1. Save the generated image to S3
    // 2. Return the S3 URL
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" // For demo only, restrict in production
      },
      body: JSON.stringify({
        imageUrl: responseBody.images[0], // Nova Canvas returns base64 images directly
        generationTime: responseBody.timingInfo?.totalTimeMillis || "unknown"
      })
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: 'Failed to generate image' })
    };
  }
};

function generatePrompt(biblicalEvent, characters, setting, language, region) {
  // This would load and use the template files from your prompts directory
  // For simplicity, including a condensed version here
  
  let template;
  // Determine which template to use based on the event type
  if (biblicalEvent.includes('teaching') || biblicalEvent.includes('sermon')) {
    template = `[SCENE_NAME] set in contemporary Nigerian [REGION] environment, featuring [BIBLICAL_CHARACTERS] [ACTION_DESCRIPTION], [TIME_OF_DAY] with [LIGHTING_DETAILS], inspirational atmosphere with observers showing expressions of deep interest, cultural elements including colorful traditional fabrics and carved wooden seating, photorealistic, high quality photograph`;
  } else if (biblicalEvent.includes('healing')) {
    template = `A [BIBLICAL_EVENT] in contemporary Nigerian [SETTING_TYPE], featuring [BIBLICAL_CHARACTERS] [MAIN_ACTION] with conveying hope and renewal, morning creating dramatic light rays through windows, witnesses showing expressions of amazement and joy, detailed cultural elements including modern architectural details with traditional patterns and contemporary clothing with cultural motifs, photorealistic image`;
  } else {
    template = `A [BIBLICAL_EVENT] in contemporary Nigerian [SETTING_TYPE], featuring [BIBLICAL_CHARACTERS] [MAIN_ACTION], [TIME_OF_DAY] lighting, cultural elements including [CULTURAL_DETAILS], photorealistic, highly detailed`;
  }
  
  // Replace template variables with actual values
  const prompt = template
    .replace('[SCENE_NAME]', biblicalEvent)
    .replace('[BIBLICAL_EVENT]', biblicalEvent)
    .replace('[REGION]', region)
    .replace('[SETTING_TYPE]', setting || 'community gathering')
    .replace('[BIBLICAL_CHARACTERS]', characters)
    .replace('[ACTION_DESCRIPTION]', 'teaching with wisdom and authority')
    .replace('[MAIN_ACTION]', 'sharing important teachings')
    .replace('[TIME_OF_DAY]', 'afternoon')
    .replace('[LIGHTING_DETAILS]', 'warm golden sunlight')
    .replace('[CULTURAL_DETAILS]', `${region} traditional patterns and clothing`);
  
  // Add system prompt elements to ensure consistency
  const systemPromptElements = "Create photorealistic image with cinematic composition that balances biblical accuracy with contemporary Nigerian cultural elements. Maintain visual continuity for recurring characters across different scenes.";
  
  return `${systemPromptElements} ${prompt}`;
}
