# StoryTeller: Image Generation Implementation Guide

## Overview
This document provides detailed implementation instructions for the image generation system in StoryTeller, using Amazon Bedrock Titan Image Generator G1 v2 with a phased approach from pre-generated to fully dynamic images.

## Phase 1: Pre-Generated Library Setup

### Step 1: Scene Identification
1. Create a spreadsheet with these columns:
   - Book
   - Chapter
   - Scene Description
   - Characters Present
   - Setting
   - Emotional Tone
   - Cultural Elements
   - Priority (1-5)

2. Fill in 50-75 key scenes from the New Testament, prioritizing:
   - Visually distinctive moments
   - Narratively important scenes
   - Recurring settings that can be reused

### Step 2: Base Prompt Structures

#### Character Portrait Template:
```
A portrait of [CHARACTER_NAME] from the Bible, wearing [CLOTHING_DESCRIPTION] in Nigerian [REGION] style. [CHARACTER_DESCRIPTION] with a [EMOTION] expression. Detailed, realistic, warm lighting, cultural adaptation.
```

#### Location Template:
```
A [TIME_OF_DAY] scene of [BIBLICAL_LOCATION] reimagined with Nigerian [REGION] architectural elements. [SETTING_DETAILS]. [WEATHER_CONDITION]. [CULTURAL_ELEMENTS]. Detailed, immersive, biblical scene.
```

#### Action Scene Template:
```
[CHARACTER_NAME] [ACTION_VERB] [ACTION_OBJECT] in [LOCATION]. Scene depicted with Nigerian cultural elements including [CULTURAL_DETAILS]. [TIME_OF_DAY] lighting, [EMOTIONAL_TONE] atmosphere. Biblical scene with cultural adaptation.
```

### Step 3: Batch Generation Process

1. **AWS Infrastructure Setup**:
   ```javascript
   // AWS Lambda function for batch generation
   const AWS = require('aws-sdk');
   const bedrock = new AWS.BedrockRuntime();
   
   exports.handler = async (event) => {
     const { promptData, batchSize } = event;
     
     const results = [];
     for (let i = 0; i < batchSize; i++) {
       try {
         const params = {
           modelId: 'stability.stable-diffusion-xl-v1',
           contentType: 'application/json',
           accept: 'application/json',
           body: JSON.stringify({
             text_prompts: [
               {
                 text: generatePrompt(promptData),
                 weight: 1.0
               },
               {
                 text: "blurry, distorted, low quality, cartoon, deformed faces, unrealistic features",
                 weight: -1.0
               }
             ],
             cfg_scale: 7.0,
             steps: 30,
             height: 1024,
             width: 1024,
             seed: Math.floor(Math.random() * 1000000), // Vary for different versions
             sampler: "K_DPMPP_2M"
           })
         };
         
         const response = await bedrock.invokeModel(params).promise();
         results.push(JSON.parse(response.body));
       } catch (error) {
         console.error("Generation error:", error);
       }
     }
     
     return results;
   };
   
   function generatePrompt(data) {
     // Template logic based on scene type
     // Insert appropriate Nigerian cultural elements
     // Return complete prompt
   }
   ```

2. **Automation Script**:
   - Create a Node.js script that reads scene spreadsheet
   - Calls Lambda function for each scene
   - Stores results in S3 bucket with appropriate metadata

## Phase 2: Hybrid System Implementation

### Dynamic Context Extraction
```javascript
function extractContextFromScripture(scriptureText, currentScene) {
  // Natural language processing to extract:
  // - Key locations
  // - Present characters
  // - Actions being performed
  // - Time references
  // - Emotional tone
  
  return {
    location: extractedLocation,
    characters: extractedCharacters,
    actions: extractedActions,
    timeOfDay: determineTimeOfDay(scriptureText),
    emotionalTone: analyzeEmotionalTone(scriptureText),
    culturalRegion: mapToCulturalRegion(currentScene.setting)
  };
}
```

### Template-Based Prompt Generation
```javascript
function generateDynamicPrompt(context) {
  // Select appropriate template based on context
  const template = selectTemplate(context);
  
  // Fill template with context values
  let prompt = template;
  for (const [key, value] of Object.entries(context)) {
    prompt = prompt.replace(`[${key.toUpperCase()}]`, value);
  }
  
  // Add Nigerian cultural elements based on language setting
  prompt = addCulturalContext(prompt, context.language);
  
  // Integrate with system prompt, avoiding redundancy
  prompt = integrateWithSystemPrompt(prompt, processedSystemPrompt);
  
  return prompt;
}

function integrateWithSystemPrompt(specificPrompt, systemPrompt) {
  // Analyze the specific prompt to identify which system prompt elements are already included
  const alreadyIncludedElements = checkForRedundancies(specificPrompt, systemPrompt);
  
  // Create a condensed system prompt by removing redundant elements
  const condensedSystemPrompt = removeRedundantElements(systemPrompt, alreadyIncludedElements);
  
  // Combine the condensed system prompt with the specific prompt
  // Either by prepending or strategic insertion based on SDXL best practices
  return `${condensedSystemPrompt} ${specificPrompt}`;
}
```

### System Prompt Integration
```javascript
// Load and prepare the system prompt
const systemPrompt = fs.readFileSync('./prompts/system-prompt.txt', 'utf8');
const processedSystemPrompt = processSystemPrompt(systemPrompt);

function processSystemPrompt(rawSystemPrompt) {
  // Extract core guidelines from the system prompt file
  // and format them for efficient integration with specific prompts
  const lines = rawSystemPrompt.split('\n');
  const relevantSections = lines.filter(line => 
    !line.startsWith('#') && !line.startsWith('//') && line.trim().length > 0
  );
  
  // Create a condensed version focusing on style descriptors and cultural elements
  return relevantSections
    .join(' ')
    .replace(/\d\.\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### AWS Bedrock Integration Component (React)
```jsx
import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const DynamicImageGenerator = ({ sceneContext, language, systemPromptOverride = null }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Generate unique cache key from context
    const cacheKey = generateCacheKey(sceneContext);
    
    // Check cache first
    checkImageCache(cacheKey)
      .then(cachedImage => {
        if (cachedImage) {
          setImage(cachedImage);
          return;
        }
        
        // If not in cache, generate new image
        setLoading(true);
        return API.post('imageGenerationApi', '/generate', {
          body: {
            sceneContext,
            language,
            model: 'stability.stable-diffusion-xl-v1',
            systemPrompt: systemPromptOverride // Allow custom system prompt if needed
          }
        });
      })
      .then(response => {
        if (response && response.imageUrl) {
          setImage(response.imageUrl);
          // Save to cache
          saveToImageCache(cacheKey, response.imageUrl);
        }
      })
      .catch(err => {
        console.error("Image generation failed:", err);
        setError(err);
        // Use fallback image
        setImage(getFallbackImage(sceneContext));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sceneContext, language, systemPromptOverride]);
  
  return (
    <div className="dynamic-image-container">
      {loading && <div className="loading-indicator">Generating image...</div>}
      {error && <div className="error-message">Could not generate image</div>}
      {image && <img src={image} alt="Bible scene" className="scene-image" />}
    </div>
  );
};

export default DynamicImageGenerator;
```

## Phase 3: Full Dynamic System

### Caching Strategy
- Implement a Redis cache for fast image retrieval
- Use semantic hashing of prompts to identify similar requests
- Store metadata about each generated image for search and reuse

### Bedrock API Configuration for Nigerian Cultural Context
- Fine-tune prompts with Nigerian cultural references:
  - Architecture: Traditional compounds, colonial-era buildings
  - Clothing: Agbada, Iro and Buba, Dashiki
  - Environment: Savannah, tropical forest, or urban settings
  - Cultural symbols: Adire patterns, traditional crafts

### Cost Optimization
1. **Implement an image generation budget system**:
   - Track API calls per user session
   - Set daily/weekly limits
   - Prioritize important narrative moments

2. **Progressive enhancement strategy**:
   - Start with lower resolution placeholders
   - Upgrade to higher quality for important scenes
   - Use simpler images for mobile devices

## Testing and Validation

### Cultural Accuracy Testing
- Create a review panel with Nigerian cultural experts
- Develop a scoring system for cultural accuracy
- Implement feedback loop to improve generation parameters

### Technical Performance Testing
- Measure average generation time
- Track cache hit ratio
- Monitor API cost per user session

## Content Filter Management

### Working with Amazon Bedrock Content Filters

Amazon Bedrock implements strict content filters that may sometimes flag religious or culturally specific content. To address this:

1. **Content Filter Testing Protocol**:
   - Implement systematic testing of prompts before production
   - Create a database of "safe" and "flagged" prompts to identify patterns
   - Develop alternative phrasings for commonly flagged religious concepts

2. **Safe Prompt Transformation Pipeline**:
   ```javascript
   function transformToSafePrompt(originalPrompt) {
     // Replace known flagged religious terms with safer alternatives
     let safePrompt = originalPrompt
       .replace(/Jesus/gi, "wise teacher")
       .replace(/healing|cured/gi, "helping")
       .replace(/miracle/gi, "extraordinary event")
       .replace(/biblical scene/gi, "historical scene")
       .replace(/blind/gi, "person in need");
     
     // Reorder prompt to emphasize cultural elements first
     const culturalMatch = safePrompt.match(/Nigerian cultural elements including (.*?)\./i);
     if (culturalMatch && culturalMatch[1]) {
       const culturalElements = culturalMatch[1];
       safePrompt = `A scene with ${culturalElements} in a traditional Nigerian setting. ${safePrompt}`;
     }
     
     return safePrompt;
   }
   ```

3. **Fallback Strategy for Filtered Prompts**:
   ```javascript
   async function generateImageWithFallback(prompt, maxAttempts = 3) {
     let currentPrompt = prompt;
     let attempts = 0;
     
     while (attempts < maxAttempts) {
       try {
         const response = await generateImage(currentPrompt);
         return response;
       } catch (error) {
         if (error.message.includes("content filters")) {
           console.log(`Prompt filtered: ${currentPrompt}`);
           // Transform to more conservative prompt
           currentPrompt = transformToSafePrompt(currentPrompt);
           attempts++;
         } else {
           throw error; // Re-throw other errors
         }
       }
     }
     
     // If all attempts fail, use pre-generated fallback image
     return getFallbackImage();
   }
   ```

4. **Progressive Prompt Strategy**:
   - Start with most abstract, safe versions of prompts
   - If successful, incrementally add more specific details in subsequent generations
   - Store successful prompts for similar future scenes

### Working with SDXL on Bedrock

Stable Diffusion XL 1.0 on Amazon Bedrock typically has less restrictive content filters for religious imagery compared to Titan Image Generator, but may still have some limitations. To optimize results:

1. **Prompt Engineering for SDXL**:
   - Use more detailed descriptive language that SDXL responds well to
   - Include artistic style references that help avoid content filter issues
   - Focus on composition and atmosphere rather than explicit religious terminology

2. **SDXL-Optimized Prompt Transformation**:
   ```javascript
   function optimizePromptForSDXL(originalPrompt) {
     // SDXL responds better to artistic framing
     let sdxlPrompt = originalPrompt
       .replace(/Jesus/gi, "a wise teacher in historical middle eastern setting")
       .replace(/healing|cured/gi, "comforting")
       .replace(/miracle/gi, "remarkable moment")
       .replace(/biblical scene/gi, "historical narrative scene");
     
     // Add style enhancers that SDXL responds well to
     sdxlPrompt += ", detailed digital illustration, soft lighting, professional photography, detailed faces, high quality";
     
     return sdxlPrompt;
   }
   ```

3. **Negative Prompt Optimization**:
   ```javascript
   const standardNegativePrompt = "blurry, distorted, low quality, cartoon, deformed faces, unrealistic features, poor anatomy, bad proportions, watermark, signature, oversaturated";
   ```

4. **Parameter Optimization for Religious Content**:
   - Use higher CFG scale (7-8) for better prompt adherence
   - Increase step count (30-50) for sensitive content
   - Experiment with different samplers (K_DPMPP_2M often works well)

### Alternative Image Generation Strategy

If Amazon Bedrock filters remain too restrictive for biblical scenes:

1. **Multi-Provider Approach**:
   - Implement connections to multiple image generation APIs (Bedrock, Groq, etc.)
   - Route religious content to more permissive services
   - Use Bedrock for non-religious, cultural-only scenes

2. **Pre-generation Pipeline**:
   - Increase reliance on pre-generated images for sensitive content
   - Use dynamic generation only for non-religious elements
   - Blend pre-generated religious elements with dynamically generated backgrounds

3. **Composite Image Strategy**:
   - Generate neutral backgrounds and settings with Bedrock
   - Generate character elements separately using alternative services
   - Compose final images from multiple generation sources

4. **Reference Image Library**:
   - Create a starter library of safe, previously approved images
   - Use these as reference images for variations rather than pure text-to-image

## Conclusion
This implementation strategy provides a pragmatic approach to building an image generation system for StoryTeller that balances cost, performance, and quality. By starting with pre-generated images and gradually introducing dynamic generation, the system can grow with user demand while maintaining cost control.
