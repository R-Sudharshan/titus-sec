import os
import httpx
import json
from .config import LLM_API_KEY

async def call_llm(messages: list) -> str:
    """
    Call Gemini or OpenAI API based on the LLM_API_KEY format.
    """
    if not LLM_API_KEY:
        return "Error: LLM_API_KEY is not configured in .env."

    # Determine provider based on key format
    if LLM_API_KEY.startswith("AIzaSy"):
        # Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={LLM_API_KEY}"
        
        # Convert ChatML format to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            if msg["role"] == "system":
                # For simplicity, prepended to system/user role or handled as systemInstruction
                contents.append({
                    "role": "user",
                    "parts": [{"text": f"[SYSTEM INSTRUCTION]\n{msg['content']}"}]
                })
            else:
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })

        payload = {"contents": contents}
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                res_data = response.json()
                text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            except Exception as e:
                return f"Gemini API Error: {str(e)}"
    else:
        # OpenAI API (or compatible local API)
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {LLM_API_KEY}",
            "Content-Type": "application/json"
        }
        # Fallback default model is gpt-4o-mini
        payload = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0.3
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                res_data = response.json()
                text = res_data["choices"][0]["message"]["content"]
                return text
            except Exception as e:
                return f"OpenAI API Error: {str(e)}"
