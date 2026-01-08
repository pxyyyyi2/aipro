from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from groq import Groq
import requests
from datetime import datetime
import secrets
import json
from bs4 import BeautifulSoup
import re
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = secrets.token_hex(16)  # For session management

# Get API key from environment variable (secure for production)
# Falls back to empty string for local dev - you should set it locally
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not set! Please set it as environment variable.")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# In-memory storage for conversation histories (per chat ID)
# Format: {chat_id: [{role: "user/assistant", content: "..."}]}
conversation_memories = {}

# Web Search Function using DuckDuckGo HTML scraping
def web_search(query, max_results=5):
    """Search the web and return results"""
    try:
        # Improve search query for weather/specific info
        if 'mausam' in query.lower() or 'weather' in query.lower():
            query += " current temperature today"
        
        # Use DuckDuckGo HTML (no API needed)
        search_url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        
        # Try to get the instant answer box first (more accurate)
        instant_answer = soup.find('div', class_='result__body')
        if instant_answer:
            text = instant_answer.get_text(strip=True)
            if text and len(text) > 20:
                results.append({
                    'title': 'Instant Answer',
                    'snippet': text[:500],
                    'url': ''
                })
        
        # Get regular search results
        result_divs = soup.find_all('div', class_='result', limit=max_results)
        
        for div in result_divs:
            try:
                title_tag = div.find('a', class_='result__a')
                snippet_tag = div.find('a', class_='result__snippet')
                
                if title_tag and snippet_tag:
                    title = title_tag.get_text(strip=True)
                    snippet = snippet_tag.get_text(strip=True)
                    
                    # Filter out very short snippets
                    if len(snippet) > 30:
                        results.append({
                            'title': title,
                            'snippet': snippet,
                            'url': title_tag.get('href', '')
                        })
            except:
                continue
        
        print(f"✅ Found {len(results)} search results")
        return results[:max_results]
    except Exception as e:
        print(f"❌ Search error: {e}")
        return []

# Check if query needs web search
def needs_web_search(message):
    """Detect if the message requires real-time information"""
    message_lower = message.lower()
    
    # Keywords that indicate need for real-time search
    search_indicators = [
        'weather', 'mausam', 'temperature', 'tapman',
        'news', 'khabar', 'latest', 'current', 'today', 'aaj',
        'price', 'kimat', 'cost', 'stock', 'bitcoin', 'crypto',
        'score', 'match', 'game', 'khel',
        'time', 'samay', 'when', 'kab',
        'who is', 'kaun hai', 'what is', 'kya hai',
        'search', 'khojo', 'find', 'dhundo',
        'how to', 'kaise', 'tutorial',
        'now', 'abhi', 'right now', 'currently'
    ]
    
    # Check if any indicator is in the message
    return any(indicator in message_lower for indicator in search_indicators)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Check if client is initialized
        if not client:
            return jsonify({
                'success': False,
                'error': 'API key not configured. Please set GROQ_API_KEY environment variable.'
            })
        
        data = request.json
        user_message = data.get('message', '')
        user_name = data.get('userName', 'Friend')
        chat_id = data.get('chatId', 'default')
        
        # Initialize conversation history for this chat if it doesn't exist
        if chat_id not in conversation_memories:
            conversation_memories[chat_id] = []
        
        # Check if we need to search the web
        search_results = []
        if needs_web_search(user_message):
            print(f"🔍 Searching web for: {user_message}")
            search_results = web_search(user_message, max_results=3)
        
        # Enhanced system prompt with developer information and search results
        system_prompt = f"""You are a helpful AI assistant with memory and web search capabilities. The user's name is {user_name}. Be friendly, concise, and helpful.

IMPORTANT INSTRUCTIONS:
1. You have memory of this conversation. Remember what the user has told you and reference it naturally in your responses.
2. If the user mentions their preferences, experiences, or personal information, remember and acknowledge it in future responses.
3. If anyone asks who created you, developed you, made you, or built this application, always respond that you were developed by Prince. He is the talented developer who created this AI Assistant Pro application.

Examples of questions to watch for:
- "Who made you?"
- "Who developed this?"
- "Who created this app?"
- "Who built this?"
- "Who is the developer?"
- "Who programmed you?"

For any such questions, proudly mention that Prince is the developer behind this project.

Remember: Use context from previous messages in this conversation to provide more personalized and contextual responses."""

        # Add search results to the prompt if available
        if search_results:
            search_context = "\n\n🔍 REAL-TIME WEB SEARCH RESULTS:\n"
            search_context += "=" * 50 + "\n"
            for i, result in enumerate(search_results, 1):
                search_context += f"\nResult {i}:\n"
                search_context += f"Title: {result['title']}\n"
                search_context += f"Information: {result['snippet']}\n"
                search_context += "-" * 50 + "\n"
            
            system_prompt += search_context
            system_prompt += """

CRITICAL INSTRUCTIONS FOR ANSWERING WITH SEARCH RESULTS:
1. Read the search results carefully and extract the exact information requested
2. Give a DIRECT answer with specific details (temperature, numbers, facts)
3. DO NOT say "I need to check" or "I recommend checking a website" - YOU ALREADY HAVE THE INFO!
4. Be confident and specific in your answer
5. If answering in Hindi, translate the information naturally
6. Keep the answer concise and to the point

Example format:
"Based on current information, Delhi mein abhi 28°C temperature hai, and it's partly cloudy with moderate air quality."
"""

        # Build messages array with conversation history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (keep last 20 messages to avoid token limits)
        recent_history = conversation_memories[chat_id][-20:]
        messages.extend(recent_history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Call Groq API with conversation context
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )
        
        response = chat_completion.choices[0].message.content
        
        # Store this exchange in memory
        conversation_memories[chat_id].append({"role": "user", "content": user_message})
        conversation_memories[chat_id].append({"role": "assistant", "content": response})
        
        # Keep memory manageable (limit to last 50 messages)
        if len(conversation_memories[chat_id]) > 50:
            conversation_memories[chat_id] = conversation_memories[chat_id][-50:]
        
        return jsonify({
            'success': True,
            'response': response,
            'searched': len(search_results) > 0  # Tell frontend if we searched
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/clear-memory', methods=['POST'])
def clear_memory():
    """Clear memory for a specific chat"""
    try:
        data = request.json
        chat_id = data.get('chatId', 'default')
        
        if chat_id in conversation_memories:
            conversation_memories[chat_id] = []
        
        return jsonify({
            'success': True,
            'message': 'Memory cleared'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        # Using Pollinations.ai - No API key needed!
        image_url = f"https://image.pollinations.ai/prompt/{requests.utils.quote(prompt)}?width=512&height=512&nologo=true"
        
        return jsonify({
            'success': True,
            'image_url': image_url
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/greeting', methods=['POST'])
def greeting():
    try:
        data = request.json
        user_name = data.get('userName', 'Friend')
        
        hour = datetime.now().hour
        if hour < 12:
            time_greeting = "Good Morning"
        elif hour < 18:
            time_greeting = "Good Afternoon"
        else:
            time_greeting = "Good Evening"
        
        greeting_message = f"{time_greeting}, {user_name}! 🌟 I'm your AI Assistant with memory and web search capabilities. I can search the internet for real-time information! How can I assist you today?"
        
        return jsonify({
            'success': True,
            'greeting': greeting_message
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Health check endpoint for Render
@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Get port from environment variable (Render sets this automatically)
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(
        debug=os.environ.get('FLASK_ENV') != 'production',
        host='0.0.0.0',
        port=port
    )