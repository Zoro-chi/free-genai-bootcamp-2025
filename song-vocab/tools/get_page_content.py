"""
Tool for fetching and extracting content from web pages.
"""

import logging
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any
import asyncio
from urllib.parse import urlparse

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

async def get_page_content(url: str, timeout: int = 10) -> Dict[str, Any]:
    """
    Fetch the content of a web page and extract useful information.
    
    Args:
        url (str): The URL of the web page to fetch
        timeout (int): Timeout for the request in seconds
        
    Returns:
        Dict[str, Any]: A dictionary containing page content and metadata
    """
    logger.info(f"Fetching page content from: {url}")
    
    result = {
        "success": False,
        "url": url,
        "html": "",
        "content": "",
        "title": "",
        "error": None
    }
    
    try:
        # Set custom headers to avoid blocks - more complete and realistic
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "sec-ch-ua": '"Google Chrome";v="93", " Not;A Brand";v="99", "Chromium";v="93"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "Cache-Control": "no-cache"
        }
        
        # Extract domain to handle site-specific issues
        domain = urlparse(url).netloc
        
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Store the raw HTML
            result["html"] = response.text
            
            # Parse the HTML with BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract the title
            title_tag = soup.find("title")
            result["title"] = title_tag.text.strip() if title_tag else ""
            
            # Handle site-specific content extraction
            if "genius.com" in domain:
                # Handle Genius.com specially - they have a complex structure
                content_divs = soup.find_all("div", attrs={"data-lyrics-container": "true"})
                if content_divs:
                    result["content"] = "\n\n".join([div.get_text("\n") for div in content_divs])
                else:
                    content_div = soup.find("div", class_="lyrics")
                    if content_div:
                        result["content"] = content_div.get_text("\n")
            elif "azlyrics.com" in domain:
                content_div = soup.find("div", class_="ringtone") 
                if content_div:
                    content_div = content_div.find_next_sibling("div")
            else:
                # General content extraction
                # Remove unwanted elements
                for unwanted in soup.find_all(['script', 'style', 'nav', 'header', 'footer', 'iframe']):
                    unwanted.decompose()
                
                # Look for likely content containers
                content_div = None
                for selector in [
                    "article", 
                    "div#lyrics", 
                    "div.lyrics", 
                    "div[class*='lyric']", 
                    "div[id*='lyric']",
                    "div.content", 
                    "div#content", 
                    "div.main-content"
                ]:
                    content_div = soup.select_one(selector)
                    if content_div and len(content_div.get_text(strip=True)) > 200:
                        break
                
                if not content_div:
                    # If no specific content div found, use the body
                    content_div = soup.find("body")
            
            # Extract the content text
            if content_div:
                # Remove nested unwanted elements from the content div
                for unwanted in content_div.find_all(['script', 'style', 'nav', 'footer']):
                    unwanted.decompose()
                
                # Get the text
                result["content"] = content_div.get_text(separator="\n", strip=True)
            
            result["success"] = True
            logger.info(f"Successfully fetched content from {url}: {len(result['content'])} chars")
            
    except httpx.TimeoutException:
        error_msg = f"Request timed out for URL: {url}"
        logger.error(error_msg)
        result["error"] = error_msg
    except httpx.HTTPStatusError as e:
        error_msg = f"HTTP error {e.response.status_code} for URL: {url}"
        logger.error(error_msg)
        result["error"] = error_msg
    except Exception as e:
        error_msg = f"Error fetching URL: {url}: {str(e)}"
        logger.error(error_msg)
        result["error"] = error_msg
    
    return result

if __name__ == "__main__":
    # Test the function with a sample URL
    import asyncio
    
    async def test():
        result = await get_page_content("https://www.azlyrics.com/lyrics/avicii/heybrother.html")
        print(f"Success: {result['success']}")
        print(f"Title: {result['title']}")
        print(f"Content (first 200 chars): {result['content'][:200]}...")
    
    asyncio.run(test())