# StoryTeller Development Guide

This document provides instructions for local development of the StoryTeller application.

## Development Environment Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/storyteller.git
   cd storyteller
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration values
   ```

## Running the Application

### Development Mode
```bash
yarn dev
```

This will start the Next.js development server at http://localhost:3000.

### Build for Production
```bash
yarn build
yarn start
```

## Development Workflow

### Mock Services vs. Real APIs

The application can run in two modes:

1. **Mock Mode (Default for Development)**
   
   Uses local mock services for Bible content and image generation to avoid API costs and dependencies.

   Files:
   - `/src/services/mockBibleService.js` - Provides Bible content
   - `/src/services/mockImageService.js` - Provides image generation

2. **API Mode (For Production)**

   Uses real APIs for Bible content and Amazon Bedrock for image generation.

   To switch to API mode for testing:
   ```javascript
   // Update in src/index.js
   window.USE_REAL_APIS = true;
   ```

### Adding New Bible Content

1. Add new content to `/src/data/bibleContent.json`
2. Follow the existing structure:
   ```json
   "Book-Chapter-language": {
     "book": "BookName",
     "chapter": 1,
     "verses": [...],
     "keyScenes": [...]
   }
   ```

### Testing Image Generation

1. Use the predefined scenes in mock services for initial testing
2. When using real APIs, be mindful of costs:
   - Use smaller image sizes during development (512x512)
   - Implement caching to avoid regenerating the same images
   - Keep track of API usage

## Project Structure

```
storyteller/
├── public/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── BibleChapterViewer.js
│   │   ├── ImageGenerator.js
│   │   └── ...
│   ├── data/               # Static data files
│   │   └── bibleContent.json
│   ├── services/           # API and service integrations
│   │   ├── mockBibleService.js
│   │   └── mockImageService.js
│   ├── utils/              # Utility functions
│   │   └── mockServices.js
│   ├── App.js              # Application root component
│   └── index.js            # Application entry point
├── lambdas/                # AWS Lambda functions
│   └── generateImage/      # Image generation Lambda
├── prompts/                # Text-to-image prompt templates
│   ├── character-prompts.txt
│   ├── scene-prompts.txt
│   ├── narrative-prompts.txt
│   └── system-prompt.txt
└── docs/                   # Documentation
```

## Working with Prompt Templates

StoryTeller uses structured prompt templates to generate consistent, high-quality images. These templates are located in the `prompts/` directory.

### Template Types

1. **Character Prompts** (`prompts/character-prompts.txt`)
   - Used for generating portraits of biblical figures
   - Parameters include CHARACTER_NAME, PHYSICAL_TRAITS, EMOTION, etc.

2. **Scene Prompts** (`prompts/scene-prompts.txt`)
   - Used for generating biblical scenes and settings
   - Parameters include SCENE_NAME, BIBLICAL_CHARACTERS, ACTION_DESCRIPTION, etc.

3. **Narrative Prompts** (`prompts/narrative-prompts.txt`)
   - Used for generating story moments and action scenes
   - Parameters include BIBLICAL_EVENT, SETTING_TYPE, MAIN_ACTION, etc.

4. **System Prompt** (`prompts/system-prompt.txt`)
   - Sets the overall tone and style for all images
   - Establishes Nigerian cultural context and quality parameters

### Testing and Refining Prompts

To test prompt templates without making actual API calls:

1. Edit the templates in the `prompts/` directory
2. Use the mock image generation service during development
3. Check the browser console to see the constructed prompt
4. Refine templates based on the results

### Adding New Templates

When adding new template types:

1. Create a new file in the `prompts/` directory
2. Follow the established parameter pattern with `[PARAMETER_NAME]` syntax
3. Include parameter descriptions and examples
4. Update the `mockImageService.js` file to use the new template type

## Lambda Function Development

For local development of the Lambda function:

1. Install the AWS SAM CLI for local Lambda testing
2. Test the function locally:
   ```bash
   cd lambdas/generateImage
   npm install
   sam local invoke -e event.json
   ```

3. Deploy the function to AWS:
   ```bash
   cd lambdas/generateImage
   zip -r function.zip .
   aws lambda update-function-code --function-name storyteller-image-generator --zip-file fileb://function.zip
   ```

## Troubleshooting Common Issues

### Mock Bible Content Not Loading
- Verify that `/src/data/bibleContent.json` exists and is valid JSON
- Check browser console for errors related to JSON parsing
- Ensure the book/chapter combination exists in the data file

### Images Not Generating
- Check browser console for error messages
- Verify the mock services are properly imported
- Make sure required parameters are provided to the ImageGenerator component

## Contributing

1. Create a feature branch from `main`
2. Make changes and test locally
3. Submit a pull request with a clear description of changes
4. Tag relevant team members for review
