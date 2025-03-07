"""
Tool for extracting vocabulary from song lyrics in various languages.
"""

# Standard library imports
import logging
from typing import List, Dict, Any
from collections import Counter

# Third-party imports
import nltk
import langid
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Common words to exclude from vocabulary
COMMON_WORDS = set([
    "the", "and", "a", "to", "of", "in", "i", "you", "is", "that", "it", "for",
    "on", "with", "as", "are", "be", "this", "was", "have", "or", "at", "not", 
    "your", "from", "my", "by", "but", "all", "they", "we", "an", "what", "so",
    "me", "do", "if", "up", "can", "no", "out", "will", "he", "she", "them",
    "when", "who", "get", "just", "like", "some", "would", "could", "should",
    "their", "there", "then", "than", "more", "been", "had", "has", "am",
    "oh", "yeah", "la", "na", "ooh", "hey", "um", "uh", "mm", "ah", "got"
])

# Initialize NLTK resources
def initialize_nltk():
    """Initialize and download required NLTK resources."""
    resources = ['punkt', 'stopwords']
    for resource in resources:
        try:
            nltk.data.find(f'tokenizers/{resource}')
            logger.debug(f"NLTK resource '{resource}' already downloaded")
        except LookupError:
            logger.info(f"Downloading NLTK resource: {resource}")
            nltk.download(resource, quiet=True)

# Initialize Japanese support if available
try:
    import fugashi
    import ipadic
    JAPANESE_SUPPORT = True
    logger.info("Japanese language support enabled (fugashi and ipadic detected)")
except ImportError:
    JAPANESE_SUPPORT = False
    logger.warning("Japanese support limited: Install fugashi and ipadic for better Japanese processing")

# Main vocabulary extraction function
def extract_vocabulary(lyrics: str) -> List[Dict[str, Any]]:
    """
    Extract vocabulary terms from lyrics based on detected language.
    
    Args:
        lyrics (str): The song lyrics
        
    Returns:
        List[Dict[str, Any]]: List of vocabulary items with metadata
    """
    # Initialize NLTK resources
    initialize_nltk()
    
    # Validate input
    if not lyrics or len(lyrics.strip()) == 0:
        logger.warning("No lyrics provided for vocabulary extraction")
        return []
    
    # Detect language
    lang, confidence = langid.classify(lyrics)
    logger.info(f"Detected language: {lang} (confidence: {confidence:.2f})")
    
    # Process based on language
    try:
        if lang == 'ja':
            return _extract_japanese_vocabulary(lyrics)
        else:
            return _extract_english_vocabulary(lyrics)
    except Exception as e:
        logger.error(f"Error extracting vocabulary: {e}")
        return []

def _extract_english_vocabulary(lyrics: str) -> List[Dict[str, Any]]:
    """
    Extract vocabulary from English lyrics.
    
    Args:
        lyrics (str): English lyrics
        
    Returns:
        List[Dict[str, Any]]: List of vocabulary items with metadata
    """
    # Simple tokenization for English - using a more robust approach
    try:
        # Try the standard tokenizer first
        words = word_tokenize(lyrics.lower())
    except LookupError:
        # If that fails, try simple splitting and fallback
        logger.warning("NLTK punkt tokenizer not available, using basic tokenization")
        # Manually download punkt if missing
        nltk.download('punkt', quiet=True)
        try:
            words = word_tokenize(lyrics.lower())
        except Exception as e:
            logger.error(f"Tokenization still failing: {e}")
            # Very basic fallback - split by whitespace and remove basic punctuation
            import re
            lyrics_clean = re.sub(r'[^\w\s]', ' ', lyrics.lower())
            words = lyrics_clean.split()
    
    # Remove punctuation, numbers, and short words
    words = [word for word in words if word.isalpha() and len(word) > 1]
    
    # Count frequencies
    word_counts = Counter(words)
    
    # Get the most common words that are not stopwords or common words
    try:
        stop_words = set(stopwords.words('english'))
    except Exception:
        logger.warning("Could not load English stopwords, using default common words")
        stop_words = COMMON_WORDS
    
    # Combine NLTK stopwords with our common words
    all_stop_words = stop_words.union(COMMON_WORDS)
    
    # Create vocabulary list
    vocabulary = [
        {
            "word": word, 
            "count": count, 
            "part_of_speech": "unknown", 
            "meaning": ""
        }
        for word, count in word_counts.most_common(50) 
        if word not in all_stop_words
    ]
    
    # Limit to most frequent 30 words
    vocabulary = vocabulary[:30]
    
    logger.info(f"Extracted {len(vocabulary)} English vocabulary items")
    return vocabulary
    
def _extract_japanese_vocabulary(lyrics: str) -> List[Dict[str, Any]]:
    """
    Extract vocabulary from Japanese lyrics.
    
    Args:
        lyrics (str): Japanese lyrics
        
    Returns:
        List[Dict[str, Any]]: List of vocabulary items with metadata
    """
    if not JAPANESE_SUPPORT:
        logger.warning("Using fallback method for Japanese text (fugashi not available)")
        return _fallback_japanese_extraction(lyrics)
    
    # Using Fugashi for Japanese tokenization
    return _tokenize_japanese_text(lyrics)

def _fallback_japanese_extraction(text: str) -> List[Dict[str, Any]]:
    """
    Fallback method for Japanese vocabulary extraction when fugashi is not available.
    
    Args:
        text (str): Japanese text
        
    Returns:
        List[Dict[str, Any]]: List of vocabulary items
    """
    # Extract unique Japanese characters as a basic fallback
    japanese_chars = list(set([c for c in text if ord(c) > 128]))
    
    # Sort by frequency in the original text for better results
    char_counts = Counter(c for c in text if c in japanese_chars)
    sorted_chars = [char for char, _ in char_counts.most_common(30)]
    
    # Create vocabulary items
    vocabulary = [
        {
            "word": char, 
            "reading": "", 
            "meaning": "", 
            "part_of_speech": "character"
        } 
        for char in sorted_chars
    ]
    
    logger.info(f"Extracted {len(vocabulary)} Japanese characters (fallback mode)")
    return vocabulary

def _tokenize_japanese_text(text: str) -> List[Dict[str, Any]]:
    """
    Tokenize Japanese text using Fugashi.
    
    Args:
        text (str): Japanese text to tokenize
        
    Returns:
        List[Dict[str, Any]]: List of Japanese vocabulary items
    """
    try:
        tagger = fugashi.Tagger()
        words = []
        
        # Process each word in the text
        for word in tagger(text):
            # Skip non-meaningful parts like particles
            if word.feature.pos1 in ["助詞", "助動詞", "記号"]:
                continue
                
            # For each word, extract the dictionary form, reading, and part of speech
            dict_form = word.feature.lemma if word.feature.lemma else word.surface
            reading = word.feature.kana if hasattr(word.feature, 'kana') else ""
            pos = word.feature.pos1
            
            if dict_form and len(dict_form) > 1:  # Only include words with at least 2 characters
                words.append({
                    "word": dict_form,
                    "reading": reading,
                    "part_of_speech": pos,
                    "meaning": ""
                })
        
        # Remove duplicates while preserving order
        unique_words = []
        seen = set()
        
        for word in words:
            if word["word"] not in seen:
                seen.add(word["word"])
                unique_words.append(word)
        
        result = unique_words[:30]  # Limit to 30 words
        logger.info(f"Extracted {len(result)} Japanese vocabulary items")
        return result
        
    except Exception as e:
        logger.error(f"Error processing Japanese text: {e}")
        return _fallback_japanese_extraction(text)

if __name__ == "__main__":
    # Test with sample lyrics
    sample_lyrics = """
    Hey brother, there's an endless road to rediscover
    Hey sister, know the water's sweet but blood is thicker
    Oh, if the sky comes falling down, for you
    There's nothing in this world I wouldn't do
    """
    
    result = extract_vocabulary(sample_lyrics)
    print(f"Extracted {len(result)} vocabulary items:")
    for item in result[:5]:
        print(f"- {item['word']} (count: {item.get('count', 'N/A')})")