const fs = require('fs');
const path = require('path');

// Load Matthew prompts
const matthewPromptsFile = path.join(__dirname, '../prompts/bible/matthew.txt');
const matthewPrompts = fs.readFileSync(matthewPromptsFile, 'utf8');

// Function to extract prompts from the text file
function extractPromptsFromText(text) {
  // Split into sections
  const sections = text.split(/^##\s+/m).filter(Boolean);
  
  const prompts = [];
  
  sections.forEach(section => {
    // Get section name from first line
    const sectionLines = section.split('\n');
    const sectionName = sectionLines[0].trim();
    
    // Process each paragraph as a prompt
    let currentPrompt = '';
    let promptName = '';
    
    for (let i = 1; i < sectionLines.length; i++) {
      const line = sectionLines[i].trim();
      
      // If line starts with ###, it's a subsection header
      if (line.startsWith('###')) {
        promptName = line.substring(3).trim();
        continue;
      }
      
      // If line is empty and we have a prompt, save it
      if (line === '' && currentPrompt) {
        // Create filename based on section and prompt name
        const filename = createImageFilename(sectionName, promptName, currentPrompt);
        
        prompts.push({
          section: sectionName,
          name: promptName,
          prompt: currentPrompt,
          filename
        });
        
        currentPrompt = '';
        continue;
      }
      
      // If not header or empty line, add to current prompt
      if (line && !line.startsWith('#')) {
        currentPrompt += line + ' ';
      }
    }
    
    // Add the last prompt if there is one
    if (currentPrompt) {
      const filename = createImageFilename(sectionName, promptName, currentPrompt);
      
      prompts.push({
        section: sectionName,
        name: promptName,
        prompt: currentPrompt,
        filename
      });
    }
  });
  
  return prompts;
}

// Create a suitable filename based on the content
function createImageFilename(section, name, prompt) {
  let baseFilename;
  
  // For character prompts
  if (section.includes('Character')) {
    const characterMatch = prompt.match(/Portrait of (\w+)/);
    const character = characterMatch ? characterMatch[1].toLowerCase() : 'character';
    baseFilename = `character_${character}`;
  }
  // For settings
  else if (section.includes('Settings')) {
    const settingMatch = name.match(/\(([^)]+)\)/);
    const setting = settingMatch ? settingMatch[1].toLowerCase().replace(/\s+/g, '_') : 'setting';
    baseFilename = `setting_${setting}`;
  }
  // For narrative scenes
  else if (section.includes('Narrative')) {
    // Extract chapter reference if possible
    const chapterMatch = name.match(/\(Chapters? (\d+)(?:-(\d+))?\)/);
    const chapter = chapterMatch ? chapterMatch[1] : '';
    
    // Extract scene type
    let sceneType = name.replace(/\([^)]+\)/g, '').trim().toLowerCase().replace(/\s+/g, '_');
    
    if (chapter) {
      baseFilename = `matthew_${chapter}_${sceneType}`;
    } else {
      baseFilename = `matthew_${sceneType}`;
    }
  }
  else {
    // Default filename based on section name
    baseFilename = section.toLowerCase().replace(/\s+/g, '_');
  }
  
  return `${baseFilename}.jpg`;
}

// Extract all the prompts
const allPrompts = extractPromptsFromText(matthewPrompts);

// Create a CSV file for tracking prompt generation
const csvLines = ['section,name,filename,prompt'];
allPrompts.forEach(p => {
  // Escape commas in the prompt
  const escapedPrompt = p.prompt.replace(/,/g, '\\,');
  csvLines.push(`${p.section},${p.name},${p.filename},${escapedPrompt}`);
});

// Write the CSV file
const outputFile = path.join(__dirname, '../prompts/matthew_generation_list.csv');
fs.writeFileSync(outputFile, csvLines.join('\n'), 'utf8');

console.log(`Extracted ${allPrompts.length} prompts for Matthew`);
console.log(`Saved generation list to ${outputFile}`);
console.log('\nNext steps:');
console.log('1. Review the CSV file for accuracy');
console.log('2. Use these prompts with Amazon Nova Canvas');
console.log('3. Save generated images to public/images/characters, public/images/settings, and public/images/narratives');
