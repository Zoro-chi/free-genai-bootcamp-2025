/**
 * Utilities for formatting verse explanations
 */

/**
 * Formats a verse explanation according to a consistent template
 * @param {Object} data - Raw explanation data
 * @param {Array} verses - Array of verse objects
 * @param {String} reference - The Bible reference (e.g., "Matthew 5:3-10")
 * @param {String} language - The target language
 * @returns {Object} - Formatted explanation
 */
export function formatExplanation(data, verses, reference, language) {
  // Create a summary of the verses being explained
  const verseSummary = summarizeVerses(verses);
  
  // Format the English explanation with clear section headings
  let formattedEnglishExplanation = data.englishExplanation || '';
  
  // Structure the translated explanation if it exists
  let formattedTranslatedExplanation = null;
  if (language !== 'english' && data.translatedExplanation) {
    formattedTranslatedExplanation = data.translatedExplanation;
  }
  
  // Format the language learning examples
  let formattedExamples = null;
  if (language !== 'english' && data.examples && data.examples.length > 0) {
    formattedExamples = data.examples;
  }
  
  // Structure the cultural context
  const formattedContext = data.culturalContext || null;
  
  // Return the formatted explanation
  return {
    reference,
    summary: verseSummary,
    englishExplanation: formattedEnglishExplanation,
    translatedExplanation: formattedTranslatedExplanation,
    examples: formattedExamples,
    culturalContext: formattedContext,
    // Add metadata for the UI
    meta: {
      language,
      verseCount: verses.length,
      hasTranslation: Boolean(formattedTranslatedExplanation),
      hasExamples: Boolean(formattedExamples),
      hasContext: Boolean(formattedContext)
    }
  };
}

/**
 * Creates a concise summary of the verses
 */
function summarizeVerses(verses) {
  if (!verses || verses.length === 0) return '';
  
  // For a single verse, use its full text
  if (verses.length === 1) {
    return verses[0].text;
  }
  
  // For multiple verses, create a summary
  const firstVerse = verses[0].text.trim();
  const lastVerse = verses[verses.length - 1].text.trim();
  
  // Extract first sentence of first verse
  const firstSentence = firstVerse.split('.')[0] + '.';
  
  // Extract last sentence of last verse
  const lastSentenceParts = lastVerse.split('.');
  const lastSentence = lastSentenceParts[lastSentenceParts.length - 2] + '.';
  
  return `${firstSentence}...${lastSentence}`;
}

/**
 * Creates a formatted markdown explanation for a given set of verses
 */
export function createMarkdownExplanation(data, verses, reference, language) {
  const formatted = formatExplanation(data, verses, reference, language);
  
  let markdown = `# Explanation of ${formatted.reference}\n\n`;
  
  // Add verse summary
  markdown += `## Verses\n\n`;
  verses.forEach(verse => {
    markdown += `> **${verse.number}.** ${verse.text}\n\n`;
  });
  
  // Add English explanation
  markdown += `## Explanation\n\n${formatted.englishExplanation}\n\n`;
  
  // Add translated explanation if available
  if (formatted.translatedExplanation) {
    const languageTitle = language.charAt(0).toUpperCase() + language.slice(1);
    markdown += `## ${languageTitle} Translation\n\n${formatted.translatedExplanation}\n\n`;
  }
  
  // Add language learning examples if available
  if (formatted.examples && formatted.examples.length > 0) {
    markdown += `## Learning Examples\n\n`;
    markdown += `| English | ${language.charAt(0).toUpperCase() + language.slice(1)} |\n`;
    markdown += `| ------- | ${'-'.repeat(language.length)} |\n`;
    
    formatted.examples.forEach(example => {
      markdown += `| ${example.english} | ${example.translated} |\n`;
    });
    
    markdown += '\n';
  }
  
  // Add cultural context if available
  if (formatted.culturalContext) {
    markdown += `## Cultural Context\n\n${formatted.culturalContext}\n\n`;
  }
  
  return markdown;
}

export default {
  formatExplanation,
  createMarkdownExplanation
};
