"""
CRUD Operations (Create, Read, Update, Delete)
Database interaction logic separated from API endpoints
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import hashlib

from database import (
    Article, Quiz, Question, User, UserResponse, 
    UserAnswer, MisinformationFlag
)
from schemas import (
    ArticleRequest, QuizSubmission, MisinformationFlagCreate,
    UserCreate
)


# ============================================================================
# ARTICLE CRUD OPERATIONS
# ============================================================================

def create_article(db: Session, url: str, content: str, summary: str, 
                  word_count: int, title: Optional[str] = None) -> Article:
    """Create a new article in database"""
    
    # Extract domain from URL
    try:
        from urllib.parse import urlparse
        source_domain = urlparse(url).netloc
    except:
        source_domain = None
    
    article = Article(
        url=url,
        title=title,
        content=content,
        summary=summary,
        word_count=word_count,
        source_domain=source_domain
    )
    
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def get_article_by_url(db: Session, url: str) -> Optional[Article]:
    """Get article by URL"""
    return db.query(Article).filter(Article.url == url).first()


def get_article_by_id(db: Session, article_id: int) -> Optional[Article]:
    """Get article by ID"""
    return db.query(Article).filter(Article.id == article_id).first()


def update_article_credibility(db: Session, article_id: int) -> Article:
    """
    Recalculate article credibility score based on user responses
    Called after each new user submission
    """
    article = get_article_by_id(db, article_id)
    if not article:
        return None
    
    # Get all user responses for this article
    responses = db.query(UserResponse).filter(
        UserResponse.article_id == article_id
    ).all()
    
    if responses:
        # Calculate credibility score (weighted average of user ratings)
        total_weight = 0
        weighted_sum = 0
        
        for response in responses:
            # Weight by user's confidence level
            weight = response.user_confidence_level
            weighted_sum += response.user_credibility_rating * weight
            total_weight += weight
        
        if total_weight > 0:
            article.credibility_score = (weighted_sum / total_weight) * 20  # Scale to 0-100
        
        # Count flags
        article.total_responses = len(responses)
        article.flagged_as_misinformation = sum(
            1 for r in responses if r.user_flagged_as_misinformation
        )
        article.flagged_as_credible = sum(
            1 for r in responses if not r.user_flagged_as_misinformation
        )
    
    db.commit()
    db.refresh(article)
    return article


# ============================================================================
# QUIZ CRUD OPERATIONS
# ============================================================================

def create_quiz(db: Session, article_id: int, num_questions: int, 
                focus_on_misinformation: bool = True) -> Quiz:
    """Create a new quiz"""
    quiz = Quiz(
        article_id=article_id,
        num_questions=num_questions,
        focus_on_misinformation=focus_on_misinformation
    )
    
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def create_questions(db: Session, quiz_id: int, questions_data: List[dict]) -> List[Question]:
    """Create questions for a quiz"""
    questions = []
    
    for idx, q_data in enumerate(questions_data, 1):
        options = q_data.get("options", [])
        
        question = Question(
            quiz_id=quiz_id,
            question_number=idx,
            question_text=q_data.get("question"),
            option_1=options[0].get("text") if len(options) > 0 else "",
            option_2=options[1].get("text") if len(options) > 1 else "",
            option_3=options[2].get("text") if len(options) > 2 else "",
            option_4=options[3].get("text") if len(options) > 3 else "",
            correct_option=q_data.get("correctAnswer"),
            is_fact_check_question=True,  # Can be determined by AI later
            tests_critical_thinking=True
        )
        
        db.add(question)
        questions.append(question)
    
    db.commit()
    return questions


def get_quiz_by_id(db: Session, quiz_id: int) -> Optional[Quiz]:
    """Get quiz with all questions"""
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


# ============================================================================
# USER CRUD OPERATIONS
# ============================================================================

def create_or_get_user(db: Session, user_identifier: Optional[str] = None) -> User:
    """Create a new user or get existing one"""
    
    if not user_identifier:
        # Generate anonymous ID
        user_identifier = f"anon_{hashlib.md5(str(datetime.utcnow()).encode()).hexdigest()[:10]}"
        is_anonymous = True
    else:
        is_anonymous = False
    
    # Check if user exists
    user = db.query(User).filter(User.user_identifier == user_identifier).first()
    
    if not user:
        user = User(
            user_identifier=user_identifier,
            is_anonymous=is_anonymous
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def update_user_statistics(db: Session, user_id: int) -> User:
    """Update user statistics after quiz submission"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    # Get all user responses
    responses = db.query(UserResponse).filter(UserResponse.user_id == user_id).all()
    
    if responses:
        user.total_quizzes_taken = len(responses)
        
        # Calculate total answers and correct answers
        total_correct = sum(r.correct_answers for r in responses)
        total_answers = sum(r.total_questions for r in responses)
        
        user.total_correct_answers = total_correct
        user.total_answers = total_answers
        user.accuracy_rate = (total_correct / total_answers * 100) if total_answers > 0 else 0
        
        # Count flags
        user.articles_flagged = db.query(MisinformationFlag).filter(
            MisinformationFlag.user_id == user_id
        ).count()
        
        user.credibility_rating_given = len(responses)
        user.last_active = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    return user


# ============================================================================
# USER RESPONSE & ANSWER CRUD OPERATIONS
# ============================================================================

def create_user_response(db: Session, submission: QuizSubmission) -> UserResponse:
    """
    Create user response and calculate score
    This is the main function for submitting quiz answers
    """
    
    # Get quiz to know article
    quiz = get_quiz_by_id(db, submission.quiz_id)
    if not quiz:
        raise ValueError(f"Quiz not found: {submission.quiz_id}")
    
    print(f"📚 Found quiz: {quiz.id}, article: {quiz.article_id}")
    
    # Calculate score
    correct_count = 0
    total_questions = len(submission.answers)
    
    print(f"📝 Processing {total_questions} answers")
    
    # Create main response record with initial score values
    user_response = UserResponse(
        user_id=submission.user_id,
        article_id=quiz.article_id,
        quiz_id=submission.quiz_id,
        total_questions=total_questions,
        correct_answers=0,  # Initialize to 0, will update later
        score_percentage=0.0,  # Initialize to 0, will update later
        user_credibility_rating=submission.user_credibility_rating,
        user_flagged_as_misinformation=submission.user_flagged_as_misinformation,
        user_confidence_level=submission.user_confidence_level,
        user_comments=submission.user_comments,
        time_taken_seconds=submission.total_time_seconds
    )
    
    db.add(user_response)
    db.flush()  # Get the ID without committing
    
    print(f"✅ Created user_response: {user_response.id}")
    
    # Create individual answer records
    for idx, answer_data in enumerate(submission.answers):
        print(f"  Answer {idx+1}: question_id={answer_data.question_id}, selected={answer_data.selected_option}")
        
        # Get the question to check correct answer
        question = db.query(Question).filter(Question.id == answer_data.question_id).first()
        if not question:
            print(f"  ⚠️ Question {answer_data.question_id} not found!")
            continue
        
        print(f"  ✓ Found question, correct={question.correct_option}")
        
        is_correct = (answer_data.selected_option == question.correct_option)
        if is_correct:
            correct_count += 1
        
        user_answer = UserAnswer(
            response_id=user_response.id,
            question_id=answer_data.question_id,
            selected_option=answer_data.selected_option,
            is_correct=is_correct,
            time_taken_seconds=answer_data.time_taken_seconds
        )
        
        db.add(user_answer)
    
    # Update response with calculated score
    user_response.correct_answers = correct_count
    user_response.score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
    
    print(f"📊 Final score: {correct_count}/{total_questions} = {user_response.score_percentage}%")
    
    db.commit()
    db.refresh(user_response)
    
    # Update article credibility
    update_article_credibility(db, quiz.article_id)
    
    # Update user statistics
    update_user_statistics(db, submission.user_id)
    
    return user_response


def get_user_response_by_id(db: Session, response_id: int) -> Optional[UserResponse]:
    """Get user response with all answers"""
    return db.query(UserResponse).filter(UserResponse.id == response_id).first()


# ============================================================================
# MISINFORMATION FLAG CRUD OPERATIONS
# ============================================================================

def create_misinformation_flag(db: Session, flag_data: MisinformationFlagCreate) -> MisinformationFlag:
    """Create a misinformation flag"""
    flag = MisinformationFlag(
        article_id=flag_data.article_id,
        user_id=flag_data.user_id,
        flag_type=flag_data.flag_type,
        severity=flag_data.severity,
        reasoning=flag_data.reasoning,
        evidence_provided=flag_data.evidence_provided
    )
    
    db.add(flag)
    db.commit()
    db.refresh(flag)
    
    # Update article credibility
    update_article_credibility(db, flag_data.article_id)
    
    return flag


def get_article_flags(db: Session, article_id: int) -> List[MisinformationFlag]:
    """Get all flags for an article"""
    return db.query(MisinformationFlag).filter(
        MisinformationFlag.article_id == article_id
    ).order_by(desc(MisinformationFlag.created_at)).all()


# ============================================================================
# ANALYTICS & STATISTICS
# ============================================================================

def get_article_statistics(db: Session, article_id: int) -> dict:
    """Get comprehensive statistics for an article"""
    article = get_article_by_id(db, article_id)
    if not article:
        return None
    
    responses = db.query(UserResponse).filter(
        UserResponse.article_id == article_id
    ).all()
    
    if not responses:
        return {
            "article_id": article_id,
            "url": article.url,
            "total_users_analyzed": 0,
            "credibility_score": 0,
            "avg_user_confidence": 0,
            "misinformation_flags": 0,
            "credible_flags": 0,
            "consensus": "not_enough_data"
        }
    
    avg_confidence = sum(r.user_confidence_level for r in responses) / len(responses)
    misinformation_count = sum(1 for r in responses if r.user_flagged_as_misinformation)
    credible_count = len(responses) - misinformation_count
    
    # Determine consensus
    if article.credibility_score >= 70:
        consensus = "high_credibility"
    elif article.credibility_score >= 40:
        consensus = "disputed"
    else:
        consensus = "likely_misinformation"
    
    return {
        "article_id": article_id,
        "url": article.url,
        "total_users_analyzed": len(responses),
        "credibility_score": article.credibility_score,
        "avg_user_confidence": avg_confidence,
        "misinformation_flags": misinformation_count,
        "credible_flags": credible_count,
        "consensus": consensus
    }


def get_top_flagged_articles(db: Session, limit: int = 10) -> List[Article]:
    """Get articles with most misinformation flags"""
    return db.query(Article).order_by(
        desc(Article.flagged_as_misinformation)
    ).limit(limit).all()


def get_most_credible_articles(db: Session, limit: int = 10) -> List[Article]:
    """Get articles with highest credibility scores"""
    return db.query(Article).filter(
        Article.total_responses >= 3  # At least 3 responses
    ).order_by(desc(Article.credibility_score)).limit(limit).all()
