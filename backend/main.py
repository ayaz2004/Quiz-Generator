from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from readability import Document

# Import our modular components
from database import init_db, get_db
from schemas import (
    ArticleRequest, ArticleResponse, QuizRequest, QuizResponse,
    QuizSubmission, QuizResultResponse, MisinformationFlagCreate,
    MisinformationFlagResponse, UserCreate, UserResponse,
    ArticleStatistics
)
import crud
from llm_service import llm_service

# Load environment variables
load_dotenv()

# Initialize database
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="Misinformation Detection API",
    description="Crowd-sourced misinformation detection through interactive quizzes",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register")
async def register_user(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user exists
        existing_user = crud.get_user_by_email(db, email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        existing_username = crud.get_user_by_username(db, username)
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Create user
        user = crud.create_authenticated_user(db, email, username, password)
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_authenticated": True
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/api/auth/login")
async def login_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Login user with email or username"""
    try:
        user = crud.authenticate_user(db, email, password)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_authenticated": True,
                "total_quizzes": user.total_quizzes_taken,
                "accuracy_rate": user.accuracy_rate
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")


@app.get("/api/auth/verify/{user_id}")
async def verify_user(user_id: int, db: Session = Depends(get_db)):
    """Verify if user session is valid"""
    user = crud.get_user_by_id(db, user_id)
    
    if not user or user.is_anonymous:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return {
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_authenticated": True
        }
    }


# ============================================================================
# ARTICLE ENDPOINTS
# ============================================================================


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "Misinformation Detection API is running",
        "version": "2.0.0",
        "features": [
            "Article Analysis",
            "Quiz Generation",
            "Crowd-sourced Credibility Rating",
            "Misinformation Flagging"
        ]
    }


@app.post("/api/fetch-article", response_model=ArticleResponse)
async def fetch_article(request: ArticleRequest, db: Session = Depends(get_db)):
    """
    Fetch article and store in database
    Returns existing article if already fetched
    """
    try:
        # Check if article already exists
        existing_article = crud.get_article_by_url(db, request.url)
        if existing_article:
            return existing_article
        
        # Fetch new article
        cleaned_url = request.url.strip()
        response = requests.get(cleaned_url, timeout=10)
        response.raise_for_status()
        html = response.text
        
        # Extract content
        doc = Document(html)
        clean_html = doc.summary()
        soup = BeautifulSoup(clean_html, "html.parser")
        text = " ".join(soup.get_text(separator="\n", strip=True).split())
        
        # Get title
        title = doc.title() or "Untitled Article"
        
        # Calculate word count
        word_count = len(text.split())
        
        # Generate summary
        sentences = text.split('. ')
        summary = '. '.join(sentences[:3])
        if len(summary) > 300:
            summary = summary[:300] + "..."
        elif not summary.endswith('.'):
            summary += "..."
        
        # Limit text length
        max_chars = 6000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        
        # Store in database
        article = crud.create_article(
            db=db,
            url=cleaned_url,
            content=text,
            summary=summary,
            word_count=word_count,
            title=title
        )
        
        return article
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing article: {str(e)}")


@app.get("/api/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get article by ID"""
    article = crud.get_article_by_id(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@app.get("/api/articles/{article_id}/statistics", response_model=ArticleStatistics)
async def get_article_stats(article_id: int, db: Session = Depends(get_db)):
    """Get comprehensive statistics for an article"""
    stats = crud.get_article_statistics(db, article_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Article not found")
    return stats


# ============================================================================
# QUIZ ENDPOINTS
# ============================================================================

@app.post("/api/generate-quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest, db: Session = Depends(get_db)):
    """
    Generate quiz from article text and store in database
    """
    try:
        # Validate input
        if not request.article_text or len(request.article_text.strip()) < 100:
            raise HTTPException(status_code=400, detail="Article text too short")
        
        if request.num_questions < 1 or request.num_questions > 10:
            raise HTTPException(status_code=400, detail="Questions must be between 1-10")
        
        # Find article in database (we need article_id)
        # For now, we'll use the first article or create a temporary one
        # In production, frontend should pass article_id
        articles = db.query(crud.Article).all()
        if not articles:
            raise HTTPException(status_code=400, detail="No article found. Fetch article first.")
        
        article = articles[-1]  # Get most recent article
        
        # Generate quiz using LLM
        quiz_data = llm_service.generate_quiz(
            article_text=request.article_text,
            num_questions=request.num_questions,
            focus_on_misinformation=request.focus_on_misinformation
        )
        
        # Store quiz in database
        quiz = crud.create_quiz(
            db=db,
            article_id=article.id,
            num_questions=request.num_questions,
            focus_on_misinformation=request.focus_on_misinformation
        )
        
        # Store questions
        crud.create_questions(db, quiz.id, quiz_data["questions"])
        
        # Prepare response
        db.refresh(quiz)
        
        response_questions = []
        for q in quiz.questions:
            response_questions.append({
                "id": q.id,
                "question": q.question_text,
                "options": [
                    {"id": 1, "text": q.option_1},
                    {"id": 2, "text": q.option_2},
                    {"id": 3, "text": q.option_3},
                    {"id": 4, "text": q.option_4}
                ],
                "correctAnswer": q.correct_option
            })
        
        return {
            "quiz_id": quiz.id,
            "article_id": quiz.article_id,
            "title": "Misinformation Detection Quiz" if quiz.focus_on_misinformation else "Comprehension Quiz",
            "questions": response_questions,
            "focus_on_misinformation": quiz.focus_on_misinformation,
            "created_at": quiz.created_at
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quiz: {str(e)}")


@app.get("/api/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz by ID"""
    quiz = crud.get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    response_questions = []
    for q in quiz.questions:
        response_questions.append({
            "id": q.id,
            "question": q.question_text,
            "options": [
                {"id": 1, "text": q.option_1},
                {"id": 2, "text": q.option_2},
                {"id": 3, "text": q.option_3},
                {"id": 4, "text": q.option_4}
            ],
            "correctAnswer": q.correct_option
        })
    
    return {
        "quiz_id": quiz.id,
        "article_id": quiz.article_id,
        "title": quiz.title,
        "questions": response_questions,
        "focus_on_misinformation": quiz.focus_on_misinformation,
        "created_at": quiz.created_at
    }


# ============================================================================
# USER ENDPOINTS
# ============================================================================

@app.post("/api/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create or get user"""
    user = crud.create_or_get_user(db, user_data.user_identifier)
    return user


@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================================================
# QUIZ SUBMISSION & RESPONSE ENDPOINTS
# ============================================================================

@app.post("/api/submit-quiz", response_model=QuizResultResponse)
async def submit_quiz(submission: QuizSubmission, db: Session = Depends(get_db)):
    """
    Submit quiz answers and credibility assessment
    This is the core endpoint for crowd-sourced misinformation detection
    """
    try:
        print(f"📥 Received quiz submission: quiz_id={submission.quiz_id}, user_id={submission.user_id}")
        
        # Create user response and calculate score
        user_response = crud.create_user_response(db, submission)
        print(f"✅ Created user response: {user_response.id}")
        
        # Get updated article credibility
        article = crud.get_article_by_id(db, user_response.article_id)
        
        # Determine community consensus
        if article.credibility_score >= 70:
            consensus = "likely_credible"
        elif article.credibility_score >= 40:
            consensus = "possibly_misleading"
        else:
            consensus = "likely_fake"
        
        return {
            "response_id": user_response.id,
            "quiz_id": user_response.quiz_id,
            "total_questions": user_response.total_questions,
            "correct_answers": user_response.correct_answers,
            "score_percentage": user_response.score_percentage,
            "user_credibility_rating": user_response.user_credibility_rating,
            "article_credibility_score": article.credibility_score,
            "community_consensus": consensus
        }
    
    except ValueError as e:
        print(f"❌ ValueError: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error submitting quiz: {str(e)}")


# ============================================================================
# MISINFORMATION FLAG ENDPOINTS
# ============================================================================

@app.post("/api/flags", response_model=MisinformationFlagResponse)
async def create_flag(flag_data: MisinformationFlagCreate, db: Session = Depends(get_db)):
    """Create a misinformation flag"""
    try:
        flag = crud.create_misinformation_flag(db, flag_data)
        return flag
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating flag: {str(e)}")


@app.get("/api/articles/{article_id}/flags", response_model=List[MisinformationFlagResponse])
async def get_article_flags(article_id: int, db: Session = Depends(get_db)):
    """Get all flags for an article"""
    flags = crud.get_article_flags(db, article_id)
    return flags


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/api/analytics/top-flagged")
async def get_top_flagged_articles(limit: int = 10, db: Session = Depends(get_db)):
    """Get articles with most misinformation flags"""
    articles = crud.get_top_flagged_articles(db, limit)
    return [{"id": a.id, "url": a.url, "flags": a.flagged_as_misinformation, 
             "credibility_score": a.credibility_score} for a in articles]


@app.get("/api/analytics/most-credible")
async def get_most_credible_articles(limit: int = 10, db: Session = Depends(get_db)):
    """Get most credible articles"""
    articles = crud.get_most_credible_articles(db, limit)
    return [{"id": a.id, "url": a.url, "credibility_score": a.credibility_score,
             "total_responses": a.total_responses} for a in articles]


# ============================================================================
# USER DASHBOARD & ACHIEVEMENTS ENDPOINTS
# ============================================================================

@app.get("/api/users/{user_id}/dashboard")
async def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Get comprehensive user dashboard statistics"""
    stats = crud.get_user_statistics_detailed(db, user_id)
    if not stats:
        raise HTTPException(status_code=404, detail="User not found")
    return stats


@app.get("/api/users/{user_id}/quiz-history")
async def get_quiz_history(user_id: int, limit: int = 50, db: Session = Depends(get_db)):
    """Get user's quiz history with details"""
    responses = crud.get_user_quiz_history(db, user_id, limit)
    
    history = []
    for response in responses:
        quiz = crud.get_quiz_by_id(db, response.quiz_id)
        article = crud.get_article_by_id(db, quiz.article_id) if quiz else None
        
        history.append({
            "response_id": response.id,
            "quiz_id": response.quiz_id,
            "completed_at": response.completed_at.isoformat(),
            "score_percentage": response.score_percentage,
            "correct_answers": response.correct_answers,
            "total_questions": response.total_questions,
            "credibility_rating": response.user_credibility_rating,
            "article_url": article.url if article else None,
            "article_title": article.title if article else None,
        })
    
    return history


@app.get("/api/users/{user_id}/achievements")
async def get_achievements(user_id: int, db: Session = Depends(get_db)):
    """Get user achievements and badges"""
    achievements = crud.get_user_achievements(db, user_id)
    return achievements


@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    """Get leaderboard of top users"""
    return crud.get_leaderboard(db, limit)


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "llm_model": "llama-3.1-8b-instant",
        "api_key_configured": bool(os.getenv("GROQ_API_KEY")),
        "database": "connected",
        "features": {
            "article_analysis": True,
            "quiz_generation": True,
            "crowd_sourcing": True,
            "misinformation_detection": True
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

