import json
import re
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()


class QuizGeneratorLLM:
    """
    Service class for generating quizzes using LLM
    Focused on misinformation detection and critical thinking
    """
    
    def __init__(self, model_name: str = "llama-3.1-8b-instant"):
        self.model = ChatGroq(model_name=model_name)
        self.misinformation_prompt = self._create_misinformation_prompt()
        self.general_prompt = self._create_general_prompt()
    
    def _create_misinformation_prompt(self) -> PromptTemplate:
        """
        Create prompt template focused on misinformation detection
        Questions will test critical thinking, fact-checking, and source evaluation
        """
        return PromptTemplate(
            input_variables=["num_questions", "article_text"],
            template="""
You are an expert quiz generator specializing in misinformation detection and media literacy.

CRITICAL RULES - MUST FOLLOW:
1. Create EXACTLY {num_questions} questions
2. EVERY question MUST have EXACTLY 4 options - NO EXCEPTIONS
3. Each option must have id (1-4) and text
4. correctAnswer must be 1, 2, 3, or 4
5. Output ONLY valid JSON - no extra text before or after

QUESTION FOCUS:
- Identify factual claims vs opinions
- Evaluate source credibility  
- Detect logical fallacies
- Verify facts from the article

STRICT JSON FORMAT - Return ONLY this structure:
[
  {{
    "id": 1,
    "question": "Question text here?",
    "options": [
      {{"id": 1, "text": "First option"}},
      {{"id": 2, "text": "Second option"}},
      {{"id": 3, "text": "Third option"}},
      {{"id": 4, "text": "Fourth option"}}
    ],
    "correctAnswer": 2,
    "explanation": "Brief explanation why answer is correct"
  }},
  {{
    "id": 2,
    "question": "Another question?",
    "options": [
      {{"id": 1, "text": "Option A"}},
      {{"id": 2, "text": "Option B"}},
      {{"id": 3, "text": "Option C"}},
      {{"id": 4, "text": "Option D"}}
    ],
    "correctAnswer": 1,
    "explanation": "Explanation"
  }}
]

ARTICLE TEXT:
\"\"\"{article_text}\"\"\"

IMPORTANT: Generate EXACTLY {num_questions} questions, each with EXACTLY 4 options. Return ONLY the JSON array:
"""
        )
    
    def _create_general_prompt(self) -> PromptTemplate:
        """
        Create prompt template for general quiz questions
        """
        return PromptTemplate(
            input_variables=["num_questions", "article_text"],
            template="""
You are a quiz generator creating comprehension questions.

CRITICAL RULES - MUST FOLLOW:
1. Create EXACTLY {num_questions} questions
2. EVERY question MUST have EXACTLY 4 options - NO EXCEPTIONS
3. Each option must have id (1-4) and text
4. correctAnswer must be 1, 2, 3, or 4
5. Output ONLY valid JSON - no extra text

STRICT JSON FORMAT:
[
  {{
    "id": 1,
    "question": "Question text here?",
    "options": [
      {{"id": 1, "text": "First complete option"}},
      {{"id": 2, "text": "Second complete option"}},
      {{"id": 3, "text": "Third complete option"}},
      {{"id": 4, "text": "Fourth complete option"}}
    ],
    "correctAnswer": 1
  }}
]

ARTICLE TEXT:
\"\"\"{article_text}\"\"\"

Generate EXACTLY {num_questions} questions, each with EXACTLY 4 options. Return ONLY the JSON array:
"""
        )
    
    def generate_quiz(
        self, 
        article_text: str, 
        num_questions: int = 5,
        focus_on_misinformation: bool = True
    ) -> dict:
        """
        Generate quiz questions from article text
        
        Args:
            article_text: The article content
            num_questions: Number of questions to generate
            focus_on_misinformation: If True, focus on critical thinking/fact-checking
        
        Returns:
            dict with questions array
        """
        
        prompt = self.misinformation_prompt if focus_on_misinformation else self.general_prompt
        
        chain = prompt | self.model | StrOutputParser()
        
        max_chars = 6000
        if len(article_text) > max_chars:
            article_text = article_text[:max_chars]
        
        raw_output = chain.invoke({
            "article_text": article_text,
            "num_questions": num_questions
        })
        
        json_match = re.search(r'\[.*\]', raw_output, re.DOTALL)
        if not json_match:
            raise ValueError("Could not extract valid JSON from LLM response")
        
        json_str = json_match.group(0)
        questions = json.loads(json_str)
        
        for q in questions:
            required_keys = ["id", "question", "options", "correctAnswer"]
            if not all(key in q for key in required_keys):
                raise ValueError(f"Question missing required keys: {q}")
            
            if len(q["options"]) != 4:
                raise ValueError(f"Question must have exactly 4 options: {q}")
        
        return {
            "questions": questions,
            "focus_on_misinformation": focus_on_misinformation
        }


llm_service = QuizGeneratorLLM()
