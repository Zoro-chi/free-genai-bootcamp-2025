"""
Tool for searching the web using DuckDuckGo Search API.
"""

import json
import logging
from duckduckgo_search import DDGS
from typing import List, Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

def search_web(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search the web using DuckDuckGo and return the results.
    
    Args:
        query (str): The search query
        max_results (int, optional): Maximum number of results to return (default: 10)
        
    Returns:
        List[Dict[str, Any]]: A list of search result dictionaries
    """
    logger.info(f"Searching web for: {query} (max results: {max_results})")
    
    try:
        results = []
        with DDGS() as ddgs:
            search_results = list(ddgs.text(query, max_results=max_results))
            
            for result in search_results:
                results.append({
                    "title": result.get("title", ""),
                    "url": result.get("href", ""),
                    "snippet": result.get("body", "")
                })
                
        logger.info(f"Found {len(results)} results for query: {query}")
        return results
    
    except Exception as e:
        logger.error(f"Error searching web: {str(e)}")
        return [{"title": f"Error searching web: {str(e)}", "url": "", "snippet": ""}]

if __name__ == "__main__":
    # Test the search function
    query = "Hey Brother by Avicii lyrics"
    results = search_web(query)
    print(json.dumps(results, indent=2, ensure_ascii=False))