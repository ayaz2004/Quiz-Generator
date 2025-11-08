"""
Pydantic Schemas for API Request/Response Validation
Separate from database models for clean separation of concerns
"""

from pydantic import BaseModel, HttpUrl, Field, validator
from typing import List, Optional
from datetime import datetime


# ============================================================================
# ARTICLE SCHEMAS
# ============================================================================

class ArticleRequest(BaseModel):
    url: str = Field(..., description="URL of the article to fetch")


class ArticleResponse(BaseModel):
    id: int
    url: str
    title: Optional[str]
    content: str
    summary: str
    word_count: int
    source_domain: Optional[str]
    credibility_score: float
    total_responses: int
    flagged_as_misinformation: int
    flagged_as_credible: int
    created_at: datetime

    class Config:
        from_attributes = True  # Enables ORM mode for SQLAlchemy models


# ============================================================================
# QUIZ SCHEMAS
# ============================================================================

class QuizOption(BaseModel):
    id: int = Field(..., ge=1, le=4, description="Option ID (1-4)")
    text: str = Field(..., description="Option text")


class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: List[QuizOption]
    correctAnswer: int = Field(..., ge=1, le=4)
    
    class Config:
        from_attributes = True


class QuizRequest(BaseModel):
    article_text: str = Field(..., min_length=100)
    num_questions: int = Field(default=5, ge=1, le=10)
    focus_on_misinformation: bool = Field(
        default=True,
        description="Generate questions focused on fact-checking and misinformation detection"
    )


class QuizResponse(BaseModel):
    quiz_id: int
    article_id: int
    title: str
    questions: List[QuizQuestionResponse]
    focus_on_misinformation: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# USER SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    user_identifier: Optional[str] = Field(None, description="Email, username, or leave empty for anonymous")
    is_anonymous: bool = Field(default=True)


class UserResponse(BaseModel):
    id: int
    user_identifier: str
    is_anonymous: bool
    total_quizzes_taken: int
    accuracy_rate: float
    articles_flagged: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# USER ANSWER & RESPONSE SCHEMAS
# ============================================================================

class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: int = Field(..., ge=1, le=4)
    time_taken_seconds: Optional[int] = Field(None, ge=0)


class QuizSubmission(BaseModel):
    quiz_id: int
    user_id: int
    answers: List[AnswerSubmission]
    
    # Misinformation assessment
    user_credibility_rating: int = Field(..., ge=1, le=5, description="1=Fake, 5=Credible")
    user_flagged_as_misinformation: bool = Field(default=False)
    user_confidence_level: int = Field(..., ge=1, le=5, description="How confident are you?")
    user_comments: Optional[str] = Field(None, max_length=1000)
    
    total_time_seconds: Optional[int] = Field(None, ge=0)


class QuizResultResponse(BaseModel):
    response_id: int
    quiz_id: int
    total_questions: int
    correct_answers: int
    score_percentage: float
    user_credibility_rating: int
    article_credibility_score: float
    community_consensus: str  # "likely_fake", "possibly_misleading", "likely_credible"
    
    class Config:
        from_attributes = True


# ============================================================================
# MISINFORMATION FLAG SCHEMAS
# ============================================================================

class MisinformationFlagCreate(BaseModel):
    article_id: int
    user_id: int
    flag_type: str = Field(..., description="Type: fake_news, misleading, satire, clickbait, etc.")
    severity: int = Field(..., ge=1, le=5)
    reasoning: str = Field(..., min_length=20, max_length=1000)
    evidence_provided: Optional[str] = Field(None, max_length=2000)


class MisinformationFlagResponse(BaseModel):
    id: int
    article_id: int
    flag_type: str
    severity: int
    reasoning: str
    verified_by_admin: bool
    admin_verdict: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# ANALYTICS & STATISTICS SCHEMAS
# ============================================================================

class ArticleStatistics(BaseModel):
    article_id: int
    url: str
    total_users_analyzed: int
    credibility_score: float
    avg_user_confidence: float
    misinformation_flags: int
    credible_flags: int
    consensus: str  # "high_credibility", "disputed", "likely_misinformation"
    
    class Config:
        from_attributes = True


class UserStatistics(BaseModel):
    user_id: int
    total_quizzes: int
    average_score: float
    total_flags_submitted: int
    contribution_level: str  # "beginner", "intermediate", "expert"
    
    class Config:
        from_attributes = True
