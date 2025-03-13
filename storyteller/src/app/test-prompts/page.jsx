'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function TestPromptsPage() {
  const [promptType, setPromptType] = useState('character');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [promptParams, setPromptParams] = useState({});
  const [finalPrompt, setFinalPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load the prompt templates on component mount
  useEffect(() => {
    loadPromptTemplate(promptType);
  }, [promptType]);
  
  const loadPromptTemplate = async (type) => {
    try {
      // In a real implementation, this would load from the file system
      // For this demo, we'll load from our mock data
      const templates = {
        character: `Portrait of [CHARACTER_NAME] with [PHYSICAL_TRAITS] in contemporary Nigerian [REGION] attire with [CLOTHING_DETAILS], [EMOTION] expression, detailed cultural elements including [CULTURAL_ELEMENTS], [FACE_DETAILS], photorealistic, [LIGHTING_DESCRIPTION], professional photography style, highly detailed, [QUALITY_ENHANCERS]`,
        scene: `[SCENE_NAME] set in contemporary Nigerian [REGION] environment, featuring [BIBLICAL_CHARACTERS] [ACTION_DESCRIPTION], [TIME_OF_DAY] with [LIGHTING_DETAILS], [EMOTIONAL_ATMOSPHERE] with observers showing [OBSERVER_REACTIONS], cultural elements including [CULTURAL_DETAILS], inspired by [ARTISTIC_STYLE] but with authentic Nigerian interpretation, highly detailed digital art, photorealistic quality, [QUALITY_ENHANCERS]`,
        narrative: `A [BIBLICAL_EVENT] in contemporary Nigerian [SETTING_TYPE], featuring [BIBLICAL_CHARACTERS] [MAIN_ACTION] with [EMOTIONAL_IMPACT], [TIME_OF_DAY] creating [LIGHTING_EFFECT], witnesses showing expressions of [EMOTIONAL_REACTIONS], detailed cultural elements including [CULTURAL_DETAILS], [COMPOSITION_NOTES], inspired by [ARTISTIC_REFERENCE] with authentic Nigerian interpretation, photorealistic digital artwork, highly detailed [HIGHLIGHT_ELEMENTS], [QUALITY_ENHANCERS]`
      };
      
      setPromptTemplate(templates[type]);
      
      // Extract parameters from the template
      const paramNames = [...templates[type].matchAll(/\[(.*?)\]/g)]
        .map(match => match[1]);
      
      // Create initial parameter values
      const initialParams = {};
      paramNames.forEach(param => {
        initialParams[param] = getDefaultValueForParam(param, type);
      });
      
      setPromptParams(initialParams);
    } catch (err) {
      console.error("Failed to load prompt template:", err);
      setError("Failed to load prompt template");
    }
  };
  
  const getDefaultValueForParam = (param, type) => {
    // Provide default values for common parameters
    const defaults = {
      'CHARACTER_NAME': 'Jesus',
      'PHYSICAL_TRAITS': 'gentle features',
      'REGION': 'Yoruba',
      'CLOTHING_DETAILS': 'flowing robe with subtle adire patterns',
      'EMOTION': 'compassionate',
      'CULTURAL_ELEMENTS': 'beaded accessories and traditional patterns',
      'FACE_DETAILS': 'well-defined features and short beard',
      'LIGHTING_DESCRIPTION': 'soft natural lighting',
      'QUALITY_ENHANCERS': '8k resolution, cinematic quality',
      
      'SCENE_NAME': 'Sermon on the Mount',
      'BIBLICAL_CHARACTERS': 'Jesus and disciples',
      'ACTION_DESCRIPTION': 'teaching with wisdom',
      'TIME_OF_DAY': 'afternoon',
      'LIGHTING_DETAILS': 'golden sunlight filtering through trees',
      'EMOTIONAL_ATMOSPHERE': 'inspirational',
      'OBSERVER_REACTIONS': 'attentive interest and wonder',
      'CULTURAL_DETAILS': 'colorful traditional fabrics and wooden seating',
      'ARTISTIC_STYLE': 'Nigerian narrative paintings',
      
      'BIBLICAL_EVENT': 'Feeding of the 5000',
      'SETTING_TYPE': 'outdoor gathering',
      'MAIN_ACTION': 'distributing bread and fish',
      'EMOTIONAL_IMPACT': 'creating wonder',
      'LIGHTING_EFFECT': 'warm golden sunlight',
      'EMOTIONAL_REACTIONS': 'amazement and gratitude',
      'COMPOSITION_NOTES': 'wide-angle perspective',
      'ARTISTIC_REFERENCE': 'documentary photography with artistic enhancement',
      'HIGHLIGHT_ELEMENTS': 'facial expressions and communal sharing'
    };
    
    return defaults[param] || param.toLowerCase().replace(/_/g, ' ');
  };
  
  const handleParamChange = (param, value) => {
    setPromptParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const buildFinalPrompt = () => {
    let result = promptTemplate;
    
    // Replace all parameters with their values
    Object.entries(promptParams).forEach(([param, value]) => {
      result = result.replace(`[${param}]`, value);
    });
    
    // Add system prompt from system-prompt.txt
    const systemPrompt = "Create photorealistic image with cinematic composition that balances biblical accuracy with contemporary Nigerian cultural elements.";
    
    setFinalPrompt(`${systemPrompt} ${result}`);
    return `${systemPrompt} ${result}`;
  };
  
  const generateImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const finalPromptText = buildFinalPrompt();
      
      // Map parameters to the right format for the API
      const apiParams = {
        biblicalEvent: promptParams.SCENE_NAME || promptParams.BIBLICAL_EVENT || null,
        characters: promptParams.CHARACTER_NAME || promptParams.BIBLICAL_CHARACTERS || null,
        setting: promptParams.SETTING_TYPE || 'Nigerian community',
        language: 'english',
        region: promptParams.REGION || 'Yoruba'
      };
      
      // Call our test API
      const response = await axios.post('/api/generate-image', apiParams);
      
      setImage(response.data);
    } catch (err) {
      console.error("Failed to generate test image:", err);
      setError("Failed to generate test image");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="App">
      <header className="bg-blue-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">StoryTeller</Link>
          <div className="text-sm">Prompt Testing</div>
        </div>
      </header>
      
      <main className="container mx-auto my-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Prompt Testing Utility</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Type</label>
          <div className="flex gap-4">
            <button 
              onClick={() => setPromptType('character')}
              className={`px-4 py-2 rounded ${promptType === 'character' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Character
            </button>
            <button 
              onClick={() => setPromptType('scene')}
              className={`px-4 py-2 rounded ${promptType === 'scene' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Scene
            </button>
            <button 
              onClick={() => setPromptType('narrative')}
              className={`px-4 py-2 rounded ${promptType === 'narrative' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Narrative
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Prompt Parameters</h2>
            <div className="max-h-[70vh] overflow-y-auto p-4 border rounded">
              <form className="space-y-4">
                {Object.entries(promptParams).map(([param, value]) => (
                  <div key={param}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                ))}
              </form>
            </div>
            
            <div className="mt-4">
              <button
                onClick={generateImage}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="border rounded p-4">
              <h3 className="font-bold text-sm text-gray-700 mb-2">Final Prompt:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm mb-4 max-h-40 overflow-y-auto">
                {finalPrompt || 'Click "Generate Image" to see the final prompt'}
              </div>
              
              <h3 className="font-bold text-sm text-gray-700 mb-2">Generated Image:</h3>
              {loading ? (
                <div className="animate-pulse bg-gray-300 h-64 w-full rounded flex items-center justify-center">
                  <p>Generating image...</p>
                </div>
              ) : error ? (
                <div className="bg-red-100 text-red-700 p-3 rounded">
                  {error}
                </div>
              ) : image ? (
                <div>
                  <img src={image.imageUrl} alt="Generated" className="w-full rounded" />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Generation time: {image.generationTime}</p>
                    <p>Model: {image.model || 'Amazon Nova Canvas (mock)'}</p>
                    <p>Dimensions: {image.dimensions || '1024x1024'}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 h-64 flex items-center justify-center rounded">
                  <p className="text-gray-500">No image generated yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
