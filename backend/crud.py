"""
CRUD Operations (Create, Read, Update, Delete)
Database interaction logic separated from API endpoints
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime
import hashlib
import secrets

from database import (
    Article, Quiz, Question, User, UserResponse, 
    UserAnswer, MisinformationFlag
)
from schemas import (
    ArticleRequest, QuizSubmission, MisinformationFlagCreate,
    UserCreate
)


# ============================================================================
# AUTHENTICATION OPERATIONS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return hash_password(plain_password) == hashed_password


def create_authenticated_user(db: Session, email: str, username: str, password: str) -> User:
    """Create a new authenticated user"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.email == email) | (User.username == username)
    ).first()
    
    if existing_user:
        raise ValueError("Email or username already exists")
    
    user = User(
        email=email,
        username=username,
        password_hash=hash_password(password),
        user_identifier=email,
        is_anonymous=False,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email_or_username: str, password: str) -> Optional[User]:
    """Authenticate user with email/username and password"""
    # Try to find user by email first
    user = db.query(User).filter(User.email == email_or_username).first()
    
    # If not found by email, try username
    if not user:
        user = db.query(User).filter(User.username == email_or_username).first()
    
    if not user or user.is_anonymous:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    # Update last active
    user.last_active = datetime.utcnow()
    db.commit()
    
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


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


def get_all_articles(db: Session, limit: int = 100, offset: int = 0) -> List[Article]:
    """Get all articles ordered by most recent"""
    return db.query(Article).order_by(desc(Article.created_at)).limit(limit).offset(offset).all()


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


# ============================================================================
# ENHANCED USER OPERATIONS - DASHBOARD & ACHIEVEMENTS
# ============================================================================

def get_user_quiz_history(db: Session, user_id: int, limit: int = 50) -> List[UserResponse]:
    """Get user's quiz history with details"""
    return db.query(UserResponse).filter(
        UserResponse.user_id == user_id
    ).order_by(desc(UserResponse.completed_at)).limit(limit).all()


def calculate_streak(responses: List[UserResponse]) -> int:
    """Calculate consecutive days user has taken quizzes"""
    if not responses:
        return 0
    
    dates = sorted(list(set([r.completed_at.date() for r in responses])), reverse=True)
    
    if not dates:
        return 0
    
    streak = 1
    for i in range(len(dates) - 1):
        diff = (dates[i] - dates[i + 1]).days
        if diff == 1:
            streak += 1
        elif diff > 1:
            break
    
    return streak


def get_user_statistics_detailed(db: Session, user_id: int) -> dict:
    """Get comprehensive user statistics for dashboard"""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    responses = db.query(UserResponse).filter(UserResponse.user_id == user_id).all()
    
    if not responses:
        return {
            "user_id": user_id,
            "user_identifier": user.user_identifier,
            "is_anonymous": user.is_anonymous,
            "total_quizzes": 0,
            "accuracy_rate": 0,
            "total_questions_answered": 0,
            "total_correct": 0,
            "avg_score": 0,
            "quizzes_by_day": {},
            "credibility_contributions": 0,
            "flags_submitted": 0,
            "rank": None,
            "total_users": 1,
            "joined_date": user.created_at.isoformat(),
            "last_active": user.last_active.isoformat() if user.last_active else None,
            "streak_days": 0
        }
    
    # Calculate statistics
    total_correct = sum(r.correct_answers for r in responses)
    total_questions = sum(r.total_questions for r in responses)
    avg_score = sum(r.score_percentage for r in responses) / len(responses)
    
    # Get quizzes by day (last 30 days)
    quizzes_by_day = {}
    for response in responses:
        day = response.completed_at.date().isoformat()
        quizzes_by_day[day] = quizzes_by_day.get(day, 0) + 1
    
    # Get user rank (based on total quizzes and accuracy)
    all_users = db.query(User).filter(User.total_quizzes_taken > 0).all()
    sorted_users = sorted(
        all_users, 
        key=lambda u: (u.total_quizzes_taken * u.accuracy_rate), 
        reverse=True
    )
    
    try:
        rank = next(i for i, u in enumerate(sorted_users, 1) if u.id == user_id)
    except StopIteration:
        rank = None
    
    # Flags submitted
    flags_count = db.query(MisinformationFlag).filter(
        MisinformationFlag.user_id == user_id
    ).count()
    
    return {
        "user_id": user_id,
        "user_identifier": user.user_identifier,
        "is_anonymous": user.is_anonymous,
        "total_quizzes": len(responses),
        "accuracy_rate": (total_correct / total_questions * 100) if total_questions > 0 else 0,
        "total_questions_answered": total_questions,
        "total_correct": total_correct,
        "avg_score": avg_score,
        "quizzes_by_day": quizzes_by_day,
        "credibility_contributions": len(responses),
        "flags_submitted": flags_count,
        "rank": rank,
        "total_users": len(all_users),
        "joined_date": user.created_at.isoformat(),
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "streak_days": calculate_streak(responses)
    }


def get_leaderboard(db: Session, limit: int = 10) -> List[dict]:
    """Get top users by quiz performance"""
    users = db.query(User).filter(
        User.total_quizzes_taken >= 1  # At least 1 quiz
    ).all()
    
    # Sort by combined score and accuracy
    sorted_users = sorted(
        users,
        key=lambda u: (u.total_quizzes_taken * u.accuracy_rate),
        reverse=True
    )[:limit]
    
    leaderboard = []
    for idx, user in enumerate(sorted_users, 1):
        leaderboard.append({
            "rank": idx,
            "user_identifier": user.user_identifier if not user.is_anonymous else f"Anonymous #{user.id}",
            "total_quizzes": user.total_quizzes_taken,
            "accuracy_rate": user.accuracy_rate,
            "total_correct": user.total_correct_answers,
            "flags_submitted": user.articles_flagged,
            "score": int(user.total_quizzes_taken * user.accuracy_rate)
        })
    
    return leaderboard


def get_user_achievements(db: Session, user_id: int) -> List[dict]:
    """Calculate user achievements/badges"""
    user = get_user_by_id(db, user_id)
    if not user:
        return []
    
    achievements = []
    
    # Quiz count badges
    if user.total_quizzes_taken >= 1:
        achievements.append({
            "id": "first_quiz",
            "title": "First Steps",
            "description": "Completed your first quiz",
            "icon": "🎯",
            "unlocked": True,
            "color": "from-blue-400 to-blue-600"
        })
    
    if user.total_quizzes_taken >= 5:
        achievements.append({
            "id": "getting_started",
            "title": "Getting Started",
            "description": "Completed 5 quizzes",
            "icon": "📚",
            "unlocked": True,
            "color": "from-green-400 to-green-600"
        })
    
    if user.total_quizzes_taken >= 10:
        achievements.append({
            "id": "quiz_master",
            "title": "Quiz Master",
            "description": "Completed 10 quizzes",
            "icon": "🏆",
            "unlocked": True,
            "color": "from-yellow-400 to-yellow-600"
        })
    
    if user.total_quizzes_taken >= 25:
        achievements.append({
            "id": "dedicated",
            "title": "Dedicated Learner",
            "description": "Completed 25 quizzes",
            "icon": "⭐",
            "unlocked": True,
            "color": "from-purple-400 to-purple-600"
        })
    
    if user.total_quizzes_taken >= 50:
        achievements.append({
            "id": "quiz_legend",
            "title": "Quiz Legend",
            "description": "Completed 50 quizzes!",
            "icon": "👑",
            "unlocked": True,
            "color": "from-orange-400 to-red-600"
        })
    
    # Accuracy badges
    if user.accuracy_rate >= 70:
        achievements.append({
            "id": "good_eye",
            "title": "Good Eye",
            "description": "Maintained 70%+ accuracy",
            "icon": "👀",
            "unlocked": True,
            "color": "from-lime-400 to-lime-600"
        })
    
    if user.accuracy_rate >= 80:
        achievements.append({
            "id": "sharp_eye",
            "title": "Sharp Eye",
            "description": "Maintained 80%+ accuracy",
            "icon": "👁️",
            "unlocked": True,
            "color": "from-cyan-400 to-cyan-600"
        })
    
    if user.accuracy_rate >= 90:
        achievements.append({
            "id": "eagle_eye",
            "title": "Eagle Eye",
            "description": "Maintained 90%+ accuracy",
            "icon": "🦅",
            "unlocked": True,
            "color": "from-indigo-400 to-indigo-600"
        })
    
    if user.accuracy_rate >= 95:
        achievements.append({
            "id": "perfectionist",
            "title": "Perfectionist",
            "description": "Maintained 95%+ accuracy!",
            "icon": "💎",
            "unlocked": True,
            "color": "from-pink-400 to-pink-600"
        })
    
    # Flag badges
    if user.articles_flagged >= 1:
        achievements.append({
            "id": "vigilant",
            "title": "Vigilant",
            "description": "Flagged your first article",
            "icon": "🚩",
            "unlocked": True,
            "color": "from-red-400 to-red-600"
        })
    
    if user.articles_flagged >= 5:
        achievements.append({
            "id": "fact_checker",
            "title": "Fact Checker",
            "description": "Flagged 5 articles for misinformation",
            "icon": "🔍",
            "unlocked": True,
            "color": "from-teal-400 to-teal-600"
        })
    
    if user.articles_flagged >= 10:
        achievements.append({
            "id": "truth_seeker",
            "title": "Truth Seeker",
            "description": "Flagged 10 articles!",
            "icon": "🛡️",
            "unlocked": True,
            "color": "from-violet-400 to-violet-600"
        })
    
    # Streak badges
    responses = db.query(UserResponse).filter(UserResponse.user_id == user_id).all()
    streak = calculate_streak(responses)
    
    if streak >= 3:
        achievements.append({
            "id": "consistent",
            "title": "Consistent",
            "description": "3 day streak",
            "icon": "📅",
            "unlocked": True,
            "color": "from-amber-400 to-amber-600"
        })
    
    if streak >= 7:
        achievements.append({
            "id": "weekly_warrior",
            "title": "Weekly Warrior",
            "description": "7 day streak!",
            "icon": "🔥",
            "unlocked": True,
            "color": "from-orange-500 to-red-600"
        })
    
    if streak >= 14:
        achievements.append({
            "id": "unstoppable",
            "title": "Unstoppable",
            "description": "14 day streak!!",
            "icon": "⚡",
            "unlocked": True,
            "color": "from-yellow-400 to-orange-600"
        })
    
    return achievements

