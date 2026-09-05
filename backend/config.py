import os
from dotenv import load_dotenv

# Always load .env at project bootstrap
load_dotenv()

LLM_API_KEY = os.getenv("LLM_API_KEY")
if not LLM_API_KEY:
    raise RuntimeError("LLM_API_KEY must be set in .env (see .env.example)")
