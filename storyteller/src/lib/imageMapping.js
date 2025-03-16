/**
 * Maps pre-generated images to their biblical references
 * MVP focused on Matthew
 */

export const imageDatabase = {
  // Character portraits
  "character-jesus-yoruba": "/images/characters/jesus_yoruba.jpg",
  "character-john-baptist-yoruba": "/images/characters/john_baptist_yoruba.jpg",
  "character-matthew-yoruba": "/images/characters/matthew_yoruba.jpg",
  "character-disciples-yoruba": "/images/characters/disciples_yoruba.jpg",
  
  // Scene settings for Matthew
  "setting-mountain-sermon": "/images/settings/mountain_sermon.jpg",
  "setting-bethlehem-night": "/images/settings/bethlehem_night.jpg",
  "setting-field-feeding": "/images/settings/field_feeding.jpg",
  
  // Matthew narrative scenes
  "matthew-1-birth": "/images/narratives/matthew_1_birth.jpg",
  "matthew-1-joseph-dream": "/images/narratives/matthew_1_joseph_dream.jpg",
  "matthew-3-baptism": "/images/narratives/matthew_3_baptism.jpg",
  "matthew-4-temptation": "/images/narratives/matthew_4_temptation.jpg",
  "matthew-5-sermon": "/images/narratives/matthew_5_sermon.jpg",
  "matthew-5-beatitudes": "/images/narratives/matthew_5_beatitudes.jpg",
  "matthew-8-healing": "/images/narratives/matthew_8_healing.jpg",
  "matthew-14-feeding": "/images/narratives/matthew_14_feeding.jpg",
  "matthew-26-last-supper": "/images/narratives/matthew_26_last_supper.jpg",
  "matthew-28-resurrection": "/images/narratives/matthew_28_resurrection.jpg"
};

/**
 * Map a biblical scene to its corresponding image
 * FOCUS: Matthew
 */
export function findImageForScene(book, chapter, event) {
  // For MVP, only process Matthew
  if (book.toLowerCase() !== 'matthew') {
    console.log('MVP is focused on Matthew only');
    return null;
  }
  
  // Try to find a direct scene match first
  const sceneKey = `${book.toLowerCase()}-${chapter}-${event.toLowerCase().replace(/\s+/g, '-')}`;
  
  if (imageDatabase[sceneKey]) {
    return imageDatabase[sceneKey];
  }
  
  // Try to find partial matches for the event
  const eventWords = event.toLowerCase().split(' ');
  for (const key in imageDatabase) {
    if (key.startsWith(`${book.toLowerCase()}-${chapter}`)) {
      if (eventWords.some(word => key.includes(word))) {
        return imageDatabase[key];
      }
    }
  }
  
  // Fallback to general settings based on context
  if (event.toLowerCase().includes('sermon') || event.toLowerCase().includes('teaching')) {
    return imageDatabase["setting-mountain-sermon"];
  } else if (event.toLowerCase().includes('birth') || event.toLowerCase().includes('nativity')) {
    return imageDatabase["setting-bethlehem-night"];
  } else if (event.toLowerCase().includes('feed') || event.toLowerCase().includes('crowd')) {
    return imageDatabase["setting-field-feeding"];
  }
  
  // Default fallback to Jesus portrait when nothing else matches
  return imageDatabase["character-jesus-yoruba"];
}
