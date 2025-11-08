"""
FastAPI Backend for Quiz Generator
This handles article fetching and quiz generation using LLM
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from readability import Document
import json
import re
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Quiz Generator API",
    description="Generate quizzes from news articles using AI",
    version="1.0.0"
)

# Configure CORS to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the LLM
model = ChatGroq(model_name="llama-3.1-8b-instant")

# Create the prompt template
quiz_from_text_prompt = PromptTemplate(
    input_variables=["num_questions", "article_text"],
    partial_variables={"format_instructions": JsonOutputParser().get_format_instructions()},
    template="""
You are a quiz generator that must follow the rules strictly.

Rules:
1. Use ONLY the provided text.
2. Create {num_questions} MCQs with 4 options.
3. You MUST include the "correct_answer" key for every question. This is mandatory.
4. Format each question as a JSON object with:
   - "id": a unique number
   - "question": the question text
   - "options": an array of objects with "id" and "text" keys
   - "correctAnswer": the id of the correct option
5. Do not invent facts.
6. Keep each question under 25 words.
7. Output must be valid JSON array. Do not add any text before or after the JSON.

Example format:
[
  {{
    "id": 1,
    "question": "What is the capital of France?",
    "options": [
      {{"id": 1, "text": "London"}},
      {{"id": 2, "text": "Berlin"}},
      {{"id": 3, "text": "Paris"}},
      {{"id": 4, "text": "Madrid"}}
    ],
    "correctAnswer": 3
  }}
]

Text passage (max 1500 words):
\"\"\"{article_text}\"\"\"

Generate the quiz now:
"""
)

# Create the chain
chain = quiz_from_text_prompt | model | StrOutputParser()


# Pydantic models for request/response validation
class ArticleRequest(BaseModel):
    url: str

class ArticleResponse(BaseModel):
    text: str
    url: str
    summary: str
    word_count: int

class QuizRequest(BaseModel):
    article_text: str
    num_questions: int = 5

class QuizOption(BaseModel):
    id: int
    text: str

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[QuizOption]
    correctAnswer: int

class QuizResponse(BaseModel):
    title: str
    questions: List[QuizQuestion]


# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "Quiz Generator API is running",
        "version": "1.0.0"
    }


@app.post("/api/fetch-article", response_model=ArticleResponse)
async def fetch_article(request: ArticleRequest):
    """
    Fetch and extract clean text from a news article URL
    """
    try:
        cleaned_url = request.url.strip()
        
        # Fetch the HTML content
        response = requests.get(cleaned_url, timeout=10)
        response.raise_for_status()
        html = response.text
        
        # Extract main content using readability
        doc = Document(html)
        clean_html = doc.summary()
        
        # Parse with BeautifulSoup to get clean text
        soup = BeautifulSoup(clean_html, "html.parser")
        text = " ".join(soup.get_text(separator="\n", strip=True).split())
        
        # Calculate word count
        word_count = len(text.split())
        
        # Generate summary (first 300 characters or 3 sentences)
        sentences = text.split('. ')
        summary = '. '.join(sentences[:3])
        if len(summary) > 300:
            summary = summary[:300] + "..."
        elif not summary.endswith('.'):
            summary += "..."
        
        # Limit text length to avoid token limits
        max_chars = 6000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        
        return ArticleResponse(
            text=text, 
            url=cleaned_url,
            summary=summary,
            word_count=word_count
        )
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch article: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the article: {str(e)}"
        )


@app.post("/api/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """
    Generate a quiz from article text using LLM
    """
    try:
        # Validate input
        if not request.article_text or len(request.article_text.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Article text is too short. Please provide more content."
            )
        
        if request.num_questions < 1 or request.num_questions > 10:
            raise HTTPException(
                status_code=400,
                detail="Number of questions must be between 1 and 10"
            )
        
        # Call the LLM chain
        raw_output = chain.invoke({
            "article_text": request.article_text[:6000],  # Limit text length
            "num_questions": request.num_questions
        })
        
        # Extract JSON from output
        match = re.search(r"\[.*\]", raw_output, re.DOTALL)
        if not match:
            raise HTTPException(
                status_code=500,
                detail="Could not extract valid quiz data from LLM response"
            )
        
        json_str = match.group(0)
        result = json.loads(json_str)
        
        # Validate the structure
        for q_item in result:
            if not all(key in q_item for key in ["id", "question", "options", "correctAnswer"]):
                raise HTTPException(
                    status_code=500,
                    detail="LLM returned incomplete quiz data. Please try again."
                )
        
        # Format response
        quiz_response = QuizResponse(
            title="Generated Quiz",
            questions=result
        )
        
        return quiz_response
    
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse quiz data. Invalid JSON format."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the quiz: {str(e)}"
        )


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "llm_model": "llama-3.1-8b-instant",
        "api_key_configured": bool(os.getenv("GROQ_API_KEY"))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
