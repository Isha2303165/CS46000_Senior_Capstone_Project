import openai
import json
from typing import Dict, Any, Union
import os
from dotenv import load_dotenv

load_dotenv()

#   FUNCTION TO FORMAT USER RESPONSES BASED ON CONTEXT FOR DISPLAY IN FRONTEND
def textizer(data: Dict[str, Any], last_chatbot_response: str = "") -> Dict[str, str]:

    client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    prompt = f"""
    You are a data formatter for a retirement planning application. Format the following data appropriately based on context.

    CONTEXT FROM LAST CHATBOT RESPONSE:
    {last_chatbot_response if last_chatbot_response else "No previous context available"}

    DATA TO FORMAT:
    {json.dumps(data, indent=2)}

    CRITICAL FORMATTING RULES - APPLY STRICTLY:
    1. For ALL text values: EVERY WORD must start with a capital letter (Title Case)
    2. For keys: Convert camelCase/snake_case to readable format with EVERY word capitalized
    3. For monetary values: Format as dollar amounts with commas (e.g., "$50,000")
    4. For ages: Format as plain numbers (e.g., "25")
    5. For percentages: Format with % symbol (e.g., "7.5%")
    6. For locations: Proper Title Case (e.g., "New York", "San Francisco", "Los Angeles")
    7. For text descriptions: Title Case Every Word (e.g., "Retirement Planning Goals")
    8. American locations are the most common, so base your checking on that.

    SPELL CHECKING RULES:
    - "retirment" → "Retirement"
    - "savigns" → "Savings"
    - "anual" → "Annual"
    - "califronia" → "California"
    - "newyork" → "New York"

    CAPITALIZATION EXAMPLES:
    - "retirement planning" → "Retirement Planning"
    - "current savings amount" → "Current Savings Amount"
    - "new york city" → "New York City"
    - "monthly income target" → "Monthly Income Target"


    Return ONLY a JSON object with formatted key-value pairs. No other text. All keys and values must be returned, IF there is no value, return nothing for the value.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a precise data formatter. Return only valid JSON with no additional text or explanation."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.1,  # Low temperature for consistent formatting
            max_tokens=1000
        )
        
        # Extract and parse the response
        formatted_text = response.choices[0].message.content.strip()
        
        # Remove any markdown code blocks if present
        if formatted_text.startswith('```json'):
            formatted_text = formatted_text[7:]
        if formatted_text.endswith('```'):
            formatted_text = formatted_text[:-3]
        
        # Parse JSON response
        formatted_data = json.loads(formatted_text)
        
        return formatted_data
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        return {str(key): str(value) for key, value in data.items()}    
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return {str(key): str(value) for key, value in data.items()}