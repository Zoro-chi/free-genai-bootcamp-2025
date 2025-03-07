"""
Song Vocabulary Agent Module

This module contains the SongAgent class for retrieving song lyrics
and extracting vocabulary for language learning purposes.
"""

# Standard library imports
import os
import uuid
import re
import logging
from typing import Dict, List, Any

# Third-party imports
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SongAgent")

# Import tools
from tools.search_web import search_web
from tools.get_page_content import get_page_content
from tools.extract_vocabulary import extract_vocabulary

# Load environment variables
load_dotenv()

class SongAgent:
    """
    Agent for retrieving song lyrics and extracting vocabulary from various languages.
    
    This agent can search the web for song lyrics, extract vocabulary from the lyrics,
    and provide language learning resources.
    """
    
    def __init__(self):
        """Initialize the SongAgent with storage for handlers and lyrics."""
        self.handlers = {}  # Store handler_id -> lyrics data mapping
        self.lyrics_dir = os.path.join(os.path.dirname(__file__), "lyrics")
        os.makedirs(self.lyrics_dir, exist_ok=True)
        logger.info(f"SongAgent initialized. Lyrics directory: {self.lyrics_dir}")
    
    async def process_lyrics_request(self, message: str) -> Dict[str, Any]:
        """
        Process a request for song lyrics and extract vocabulary.
        
        Args:
            message (str): The user's query containing song info
            
        Returns:
            Dict: A dictionary with lyrics, vocabulary, handler_id, and lyrics_path
        """
        logger.info(f"Processing lyrics request: {message}")
        
        # Generate a unique handler ID for this request
        handler_id = str(uuid.uuid4())
        logger.info(f"Generated handler ID: {handler_id}")
        
        # Extract the search query to help build a filename later
        search_query = self._extract_search_query(message)
        
        # Check if this is a request for Japanese lyrics
        is_japanese_request = "japanese" in message.lower() or any(ord(c) > 128 for c in message)
        
        # Search for lyrics directly using the user's query
        lyrics_data = await self._search_for_lyrics_direct(message, is_japanese=is_japanese_request)
        
        if not lyrics_data or not lyrics_data.get('lyrics'):
            logger.warning(f"No lyrics found for: {message}")
            # Create a placeholder file for the error case
            error_message = f"Could not find lyrics for: {message}"
            lyrics_path = self._save_lyrics_to_file(
                error_message, 
                handler_id,
                song_title="Unknown Song",
                artist="Unknown Artist"
            )
            
            result = {
                "lyrics": error_message,
                "vocabulary": [],
                "handler_id": handler_id,
                "lyrics_path": lyrics_path
            }
            
            # Store for later reference
            self.handlers[handler_id] = result
            return result
        
        # Get lyrics and metadata
        lyrics = lyrics_data.get('lyrics', '')
        song_title = lyrics_data.get('song_title', search_query)
        artist = lyrics_data.get('artist', '')
        romaji_lyrics = lyrics_data.get('romaji_lyrics', '')
        
        # Generate a song ID based on title and artist
        song_id = self._generate_song_id(song_title, artist)
        
        # Save lyrics to file with descriptive name and song ID
        lyrics_path = self._save_lyrics_to_file(lyrics, handler_id, song_title, artist)
        logger.info(f"Lyrics saved to: {lyrics_path}")
        
        # Save romaji version if available
        romaji_path = ""
        if romaji_lyrics:
            romaji_path = self._save_lyrics_to_file(
                romaji_lyrics, 
                f"{handler_id}_romaji",
                f"{song_title} (Romaji)", 
                artist
            )
            logger.info(f"Romaji lyrics saved to: {romaji_path}")
        
        # Extract vocabulary
        try:
            vocabulary = extract_vocabulary(lyrics)
            logger.info(f"Extracted {len(vocabulary)} vocabulary items")
        except Exception as e:
            logger.error(f"Error extracting vocabulary: {e}")
            vocabulary = []  # Provide an empty list if extraction fails
        
        # Store for later reference
        result = {
            "lyrics": lyrics,
            "romaji_lyrics": romaji_lyrics,
            "vocabulary": vocabulary,
            "handler_id": handler_id,
            "lyrics_path": lyrics_path,
            "romaji_path": romaji_path,
            "song_title": song_title,
            "artist": artist,
            "song_id": song_id
        }
        self.handlers[handler_id] = result
        
        return result

    def _parse_song_request(self, message: str) -> Dict[str, str]:
        """
        Extract song info from the request message.
        
        Args:
            message (str): User request message
            
        Returns:
            Dict: Extracted song, artist, and language information
        """
        # Improved regex patterns for better extraction
        song_match = re.search(r"song\s+([^by]+?)(?:\s+by|\s*$)", message, re.IGNORECASE)
        artist_match = re.search(r"by\s+([^in]+?)(?:\s+in|\s*$)", message, re.IGNORECASE)
        language_match = re.search(r"in\s+(\w+)\s*$", message, re.IGNORECASE)
        
        song = song_match.group(1).strip() if song_match else ""
        artist = artist_match.group(1).strip() if artist_match else ""
        language = language_match.group(1).strip() if language_match else "english"
        
        # Log the extracted parts for debugging
        logger.info(f"Extracted song: '{song}', artist: '{artist}', language: '{language}'")
        
        return {
            "song": song,
            "artist": artist,
            "language": language
        }
    
    def _save_lyrics_to_file(self, lyrics: str, handler_id: str, song_title: str = "", artist: str = "") -> str:
        """
        Save lyrics to a file with a descriptive name.
        
        Args:
            lyrics (str): The lyrics content to save
            handler_id (str): Unique identifier for the lyrics
            song_title (str): Title of the song
            artist (str): Artist name
            
        Returns:
            str: Path to the saved lyrics file
        """
        # Sanitize filename - remove invalid characters
        def sanitize_filename(name):
            # Remove or replace characters that aren't allowed in filenames
            return re.sub(r'[\\/*?:"<>|]', "", name).strip()
        
        # Build the filename
        if song_title and artist:
            # Create a descriptive filename: "Song Title - Artist.txt"
            filename = f"{sanitize_filename(song_title)} - {sanitize_filename(artist)}"
            # Add the handler_id to ensure uniqueness
            filename = f"{filename}_{handler_id[-8:]}.txt"
        else:
            # Fallback to just using the handler_id if we don't have song/artist info
            filename = f"{handler_id}.txt"
            
        lyrics_path = os.path.join(self.lyrics_dir, filename)
        with open(lyrics_path, 'w', encoding='utf-8') as f:
            f.write(lyrics)
            
        return lyrics_path

    async def _search_for_lyrics(self, song_info: Dict[str, str]) -> str:
        """
        Search for song lyrics online using DuckDuckGo.
        
        Args:
            song_info (Dict): Information about the song, artist, and language
            
        Returns:
            str: The found lyrics or empty string if not found
        """
        song = song_info.get("song", "")
        artist = song_info.get("artist", "")
        language = song_info.get("language", "").lower()
        
        # Construct search queries - more specific now
        queries = [
            f"{song} {artist} lyrics",  # Standard search
            f"\"{song}\" \"{artist}\" lyrics",  # Exact match search
        ]
        
        # Language-specific queries
        if language == "japanese":
            queries.append(f"{song} {artist} 歌詞")  # Japanese lyrics search
        
        logger.info(f"Searching with queries: {queries}")
        
        # Try each query
        for query in queries:
            logger.info(f"Executing search with query: {query}")
            
            # Step 1: Search the web using DuckDuckGo
            search_results = search_web(query, 10)  # Get top 10 results
            
            if not search_results:
                logger.warning(f"No search results found for query: {query}")
                continue
                
            # Log the search results for debugging
            for i, result in enumerate(search_results):
                logger.info(f"Result {i+1}: {result['title']} - {result['url']}")
            
            # Step 2: Check each result for lyrics
            for result in search_results:
                url = result.get("url", "")
                title = result.get("title", "")
                
                if not url:
                    continue
                    
                # Skip non-lyrics sites or sites we know won't work well
                skip_domains = ['youtube.com', 'spotify.com', 'apple.com', 'amazon.com']
                if any(domain in url for domain in skip_domains):
                    logger.info(f"Skipping non-lyrics site: {url}")
                    continue
                
                # Promising lyrics sites
                lyrics_domains = [
                    'lyrics.com', 'azlyrics.com', 'genius.com', 'metrolyrics.com', 
                    'songlyrics.com', 'musixmatch.com', 'j-lyric.net', 'uta-net.com'
                ]
                
                # If it's a promising lyrics site or has "lyrics" in the title
                if any(domain in url for domain in lyrics_domains) or "lyrics" in title.lower():
                    logger.info(f"Fetching content from potential lyrics site: {url}")
                    
                    # Step 3: Get page content
                    page_result = await get_page_content(url)
                    
                    if not page_result.get("success", False):
                        logger.warning(f"Failed to fetch page content: {url}")
                        continue
                    
                    # Step 4: Extract lyrics from the page
                    lyrics = self._extract_lyrics_from_page(page_result, song, artist)
                    
                    if lyrics:
                        logger.info(f"Successfully extracted lyrics from {url}")
                        return lyrics
        
        # If we've tried all queries and sites but still no lyrics
        logger.warning(f"Could not find lyrics for {song} by {artist}")
        return ""
    
    async def _search_for_lyrics_direct(self, query: str, is_japanese: bool = False) -> Dict[str, Any]:
        """
        Search for song lyrics directly using the user's query.
        
        Args:
            query (str): The user's original query
            is_japanese (bool): Whether to prioritize Japanese lyrics search
            
        Returns:
            Dict: A dictionary containing lyrics and metadata
        """
        # Extract the search query from the user's message
        search_query = self._extract_search_query(query)
        
        # Try to extract song title and artist from the query
        song_info = self._parse_song_request(query)
        song_title = song_info.get('song', '')
        artist = song_info.get('artist', '')
        
        # Construct search queries
        queries = [
            f"{search_query} lyrics",  # Add 'lyrics' if not present
        ]
        
        # If we have both song and artist, add a more specific query
        if song_title and artist:
            queries.insert(0, f"{song_title} {artist} lyrics")
        
        # For Japanese requests, prioritize Japanese lyrics search
        if is_japanese:
            # Add Japanese-specific search terms
            if song_title and artist:
                queries.insert(0, f"{song_title} {artist} 歌詞 日本語")
                queries.insert(1, f"{song_title} {artist} 歌詞")
            else:
                queries.insert(0, f"{search_query} 歌詞 日本語")
                queries.insert(1, f"{search_query} 歌詞")
        
        logger.info(f"Searching with queries: {queries}")
        
        # Variables to store the results
        japanese_lyrics = ""
        romaji_lyrics = ""
        best_lyrics = ""
        
        # Try each query
        for search_query in queries:
            logger.info(f"Executing search with query: {search_query}")
            
            # Step 1: Search the web using DuckDuckGo
            search_results = search_web(search_query, 15)  # Get more results for better coverage
            
            if not search_results:
                logger.warning(f"No search results found for query: {search_query}")
                continue
                
            # Log the search results for debugging
            for i, result in enumerate(search_results):
                logger.info(f"Result {i+1}: {result['title']} - {result['url']}")
            
            # Try to extract song and artist from search results if we don't have them
            if not song_title or not artist:
                for result in search_results[:3]:  # Use top 3 results
                    title = result.get('title', '')
                    # Look for patterns like "Song Name Lyrics by Artist"
                    match = re.search(r'^(.*?)\s+lyrics\s+(?:by|:)\s+(.*?)(?:\s+|$)', title, re.IGNORECASE)
                    if match:
                        extracted_song = match.group(1).strip()
                        extracted_artist = match.group(2).strip()
                        if extracted_song and not song_title:
                            song_title = extracted_song
                        if extracted_artist and not artist:
                            artist = extracted_artist
                        break
            
            # Step 2: Check each result for lyrics
            for result in search_results:
                url = result.get("url", "")
                title = result.get("title", "")
                
                if not url:
                    continue
                    
                # Skip non-lyrics sites or sites we know won't work well
                skip_domains = ['youtube.com', 'spotify.com', 'apple.com', 'amazon.com']
                if any(domain in url for domain in skip_domains):
                    logger.info(f"Skipping non-lyrics site: {url}")
                    continue
                
                # Check if this is likely a Japanese lyrics site
                is_jp_site = any(jp_domain in url.lower() for jp_domain in 
                               ['uta-net.com', 'j-lyric.net', 'utamap.com', 'kashinavi.com'])
                
                # Check if this is likely a romaji lyrics site
                is_romaji_site = "romaji" in url.lower() or "romanized" in url.lower()
                
                # If it's a promising lyrics site
                if "lyrics" in url.lower() or "lyrics" in title.lower() or "歌詞" in url.lower():
                    logger.info(f"Fetching content from potential lyrics site: {url}")
                    
                    # Step 3: Get page content
                    page_result = await get_page_content(url)
                    
                    if not page_result.get("success", False):
                        logger.warning(f"Failed to fetch page content: {url}")
                        continue
                    
                    # Step 4: Extract lyrics from the page
                    extracted_lyrics = self._extract_lyrics_from_page(page_result, song_title, artist)
                    
                    if not extracted_lyrics:
                        continue
                        
                    logger.info(f"Successfully extracted lyrics from {url}")
                    
                    # Update metadata from page title if needed
                    page_title = page_result.get('title', '')
                    if (not song_title or not artist) and 'lyrics' in page_title.lower():
                        # Example: "Song Name Lyrics | Artist Name"
                        title_parts = page_title.split('|')
                        if len(title_parts) >= 2:
                            title_part = title_parts[0].lower().replace('lyrics', '').strip()
                            artist_part = title_parts[1].strip()
                            if not song_title:
                                song_title = title_part
                            if not artist:
                                artist = artist_part
                    
                    # Determine the type of lyrics we found
                    if is_japanese and is_jp_site and self._is_japanese_text(extracted_lyrics):
                        # This is Japanese lyrics
                        japanese_lyrics = extracted_lyrics
                        logger.info("Found original Japanese lyrics")
                    elif is_japanese and is_romaji_site:
                        # This is likely romaji version
                        romaji_lyrics = extracted_lyrics
                        logger.info("Found romaji version of lyrics")
                    else:
                        # This is regular lyrics, store if we don't have better
                        if not best_lyrics:
                            best_lyrics = extracted_lyrics
                            
                    # If we have both Japanese and romaji versions, we can stop searching
                    if is_japanese and japanese_lyrics and romaji_lyrics:
                        break
                        
            # If we found what we needed, stop searching with other queries
            if is_japanese and japanese_lyrics:
                break
            elif not is_japanese and best_lyrics:
                break
        
        # Prepare the final result
        # For Japanese requests, prefer Japanese lyrics
        final_lyrics = japanese_lyrics if is_japanese and japanese_lyrics else best_lyrics
        
        # If we've tried all queries and sites but still no lyrics
        if not final_lyrics:
            logger.warning(f"Could not find lyrics for query: {query}")
            return {'lyrics': '', 'song_title': song_title, 'artist': artist}
            
        return {
            'lyrics': final_lyrics,
            'romaji_lyrics': romaji_lyrics,
            'song_title': song_title or search_query,
            'artist': artist or 'Unknown Artist'
        }
        
    def _extract_search_query(self, query: str) -> str:
        """
        Extract the search part from the user's query.
        
        Args:
            query (str): The user's original query
            
        Returns:
            str: The search query to use
        """
        # Remove phrases like "Find lyrics for the song" or "Get me the lyrics of"
        patterns = [
            r"find lyrics for( the)? song",
            r"get( me)? the lyrics( of| for)?",
            r"search for lyrics( of| for)?",
            r"show lyrics( of| for)?",
            r"what are the lyrics( of| for)?"
        ]
        
        result = query
        for pattern in patterns:
            result = re.sub(pattern, "", result, flags=re.IGNORECASE)
        
        # Clean up any language specification
        result = re.sub(r"in (english|japanese|spanish|french|german|italian|chinese|korean)\.?$", "", result, flags=re.IGNORECASE)
        
        return result.strip()
    
    def _extract_lyrics_from_page(self, page_result: Dict[str, Any], song: str, artist: str) -> str:
        """
        Extract lyrics from a page's content.
        
        Args:
            page_result (Dict[str, Any]): Page content and metadata
            song (str): Song name for verification
            artist (str): Artist name for verification
            
        Returns:
            str: Extracted lyrics or empty string
        """
        html = page_result.get("html", "")
        content = page_result.get("content", "")
        url = page_result.get("url", "")
        
        if not html:
            return ""
        
        # Parse the HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        # Special handling for known lyrics sites
        if "genius.com" in url:
            # Genius.com specific extraction - they have a complicated structure
            logger.info("Using specialized extraction for Genius.com")
            
            # First try the older structure
            lyrics_container = soup.find("div", class_="lyrics")
            
            # If that fails, try the newer structure with data attributes
            if not lyrics_container:
                lyrics_containers = soup.find_all("div", attrs={"data-lyrics-container": "true"})
                if lyrics_containers:
                    combined_lyrics = "\n\n".join([container.get_text("\n") for container in lyrics_containers])
                    return self._clean_lyrics_text(combined_lyrics)
        
        # Try different selectors for other sites
        lyrics_selectors = [
            "div.lyrics",               # Common lyrics class
            "div.lyricbox",             # LyricWiki
            "div.ringtone ~ div",       # AZLyrics
            "div.songLyricsV14",        # MetroLyrics
            "div.entry-content",        # Blog-based lyrics
            "div#kashi_area",           # Japanese site: uta-net
            "div.lyricBox",             # Japanese site: j-lyric
            "div.noprint",              # Japanese site: utamap
            "div[class*='lyrics']",     # Generic lyrics class
            "div[id*='lyrics']",        # Generic lyrics ID
            "pre",                      # Sometimes lyrics are in pre tags
            "article",                  # Some sites use article tags
            ".lyrics__content",         # Another common class
            "#lyric-body-text",         # Common ID
        ]
        
        # Try each selector
        for selector in lyrics_selectors:
            logger.info(f"Trying to extract lyrics with selector: {selector}")
            elements = soup.select(selector)
            if elements:
                # Get the text from the first matching element
                lyrics_text = elements[0].get_text(separator="\n", strip=True)
                
                # Clean up the lyrics
                lyrics_text = self._clean_lyrics_text(lyrics_text)
                
                # Basic validation - lyrics should be reasonably long
                if len(lyrics_text) > 100:
                    logger.info(f"Extracted lyrics with selector {selector}: {len(lyrics_text)} characters")
                    return lyrics_text
        
        # If no specific container found, try to extract from page content intelligently
        if content:
            # This might be better if selectors didn't work
            return self._extract_lyrics_from_content(content, song, artist)
        
        logger.warning("Could not identify lyrics in the page content")
        return ""

    def _extract_lyrics_from_content(self, content: str, song: str, artist: str) -> str:
        """
        Extract lyrics from plain text content using heuristics.
        
        Args:
            content (str): The page content
            song (str): Song name for verification
            artist (str): Artist name for verification
            
        Returns:
            str: Extracted lyrics or empty string
        """
        lines = content.split('\n')
        
        # Look for sections that look like lyrics (multiple short lines)
        line_groups = []
        current_group = []
        
        for line in lines:
            line = line.strip()
            # Typical lyrics lines are short and don't end with punctuation like periods
            if line and len(line) < 150:
                current_group.append(line)
            elif current_group:
                # End of a group of short lines
                if len(current_group) > 5:  # Reasonable number of lines for lyrics
                    line_groups.append(current_group)
                current_group = []
        
        # Add the last group if it exists
        if current_group and len(current_group) > 5:
            line_groups.append(current_group)
        
        # Find the largest group of lines that could be lyrics
        if not line_groups:
            return ""
            
        # Sort groups by length (number of lines)
        line_groups.sort(key=len, reverse=True)
        
        # Try the largest groups first
        for group in line_groups[:3]:  # Check the top 3 largest groups
            lyrics_text = "\n".join(group)
            
            # Additional validation - look for verse markers or common lyric patterns
            if any(marker in lyrics_text.lower() for marker in 
                   ["verse", "chorus", "bridge", "hook", "intro", "outro"]):
                logger.info(f"Found lyrics with verse markers ({len(lyrics_text)} characters)")
                return self._clean_lyrics_text(lyrics_text)
        
        # If no clear verse markers, just take the largest group
        lyrics_text = "\n".join(line_groups[0])
        return self._clean_lyrics_text(lyrics_text)

    def _clean_lyrics_text(self, lyrics_text: str) -> str:
        """
        Clean and format lyrics text.
        
        Args:
            lyrics_text (str): Raw lyrics text
            
        Returns:
            str: Cleaned lyrics text
        """
        # Remove ads or "Lyrics" header text if present
        ad_phrases = [
            "lyrics licensed & provided by",
            "lyrics provided by",
            "lyrics powered by",
            "lyrics from lyrics.com",
            "lyrics from azlyrics",
        ]
        
        for phrase in ad_phrases:
            lyrics_text = re.sub(f".*{phrase}.*\n?", "", lyrics_text, flags=re.IGNORECASE)
        
        # Remove [Verse], [Chorus], etc. - but only from the beginning of lines
        lyrics_text = re.sub(r'^\[.*?\]', '', lyrics_text, flags=re.MULTILINE)
        
        # Remove HTML artifacts
        lyrics_text = re.sub(r'<.*?>', '', lyrics_text)
        
        # Replace multiple spaces and tabs with a single space
        lyrics_text = re.sub(r'[ \t]+', ' ', lyrics_text)
        
        # Replace multiple newlines with a single newline
        lyrics_text = re.sub(r'\n{3,}', '\n\n', lyrics_text)
        
        # Remove leading/trailing whitespace from each line
        lines = [line.strip() for line in lyrics_text.split('\n')]
        lyrics_text = '\n'.join(lines)
        
        return lyrics_text.strip()
    
    def _generate_song_id(self, song_title: str, artist: str) -> str:
        """
        Generate a unique song ID based on song title and artist.
        
        Args:
            song_title (str): The title of the song
            artist (str): The artist name
            
        Returns:
            str: A unique song ID
        """
        # Create a base string from song title and artist
        base_string = f"{song_title.lower()}-{artist.lower()}"
        
        # Remove special characters and spaces
        base_string = re.sub(r'[^\w]', '-', base_string)
        
        # Remove consecutive dashes and ensure it's not too long
        base_string = re.sub(r'-+', '-', base_string).strip('-')[:50]
        
        # Add a short hash for uniqueness
        import hashlib
        hash_suffix = hashlib.md5(f"{song_title}:{artist}".encode()).hexdigest()[:6]
        
        return f"{base_string}-{hash_suffix}"
    
    def _is_japanese_text(self, text: str) -> bool:
        """
        Check if the text is primarily Japanese.
        
        Args:
            text (str): Text to check
            
        Returns:
            bool: True if the text appears to be Japanese
        """
        # Count Japanese characters (hiragana, katakana, kanji)
        jp_chars = sum(1 for c in text if ord(c) > 0x2E80 and ord(c) < 0x9FFF)
        
        # If more than 20% of non-whitespace characters are Japanese, consider it Japanese text
        non_whitespace = sum(1 for c in text if not c.isspace())
        return non_whitespace > 0 and jp_chars / non_whitespace > 0.2
