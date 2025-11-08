"""
Database Configuration and Models
Using SQLAlchemy ORM with SQLite (can easily switch to PostgreSQL/MySQL)
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL - using SQLite for development (easy to switch to PostgreSQL)
# For production, use: postgresql://user:password@localhost/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./misinformation_detection.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # Set to True for SQL debug logs
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


# ============================================================================
# DATABASE MODELS
# ============================================================================

class Article(Base):
    """
    Stores articles that have been analyzed
    """
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), unique=True, index=True, nullable=False)
    title = Column(String(500))
    content = Column(Text, nullable=False)
    summary = Column(Text)
    word_count = Column(Integer)
    source_domain = Column(String(200))
    
    # Misinformation analysis
    credibility_score = Column(Float, default=0.0)  # 0-100 scale
    total_responses = Column(Integer, default=0)
    flagged_as_misinformation = Column(Integer, default=0)
    flagged_as_credible = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quizzes = relationship("Quiz", back_populates="article", cascade="all, delete-orphan")
    user_responses = relationship("UserResponse", back_populates="article", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Article(id={self.id}, url={self.url[:50]}...)>"


class Quiz(Base):
    """
    Stores generated quizzes for articles
    """
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    title = Column(String(300), default="Misinformation Detection Quiz")
    num_questions = Column(Integer, nullable=False)
    
    # Quiz focus
    focus_on_misinformation = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    article = relationship("Article", back_populates="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    user_responses = relationship("UserResponse", back_populates="quiz", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Quiz(id={self.id}, article_id={self.article_id}, questions={self.num_questions})>"


class Question(Base):
    """
    Stores individual quiz questions
    """
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    
    # Answer options (stored as JSON-like structure)
    option_1 = Column(Text, nullable=False)
    option_2 = Column(Text, nullable=False)
    option_3 = Column(Text, nullable=False)
    option_4 = Column(Text, nullable=False)
    
    correct_option = Column(Integer, nullable=False)  # 1, 2, 3, or 4
    
    # Misinformation detection specific
    is_fact_check_question = Column(Boolean, default=False)
    tests_critical_thinking = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    user_answers = relationship("UserAnswer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Question(id={self.id}, quiz_id={self.quiz_id}, text={self.question_text[:50]}...)>"


class User(Base):
    """
    Stores user information (optional - for crowd-sourcing)
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(100), unique=True, index=True)  # Can be email, username, or anonymous ID
    is_anonymous = Column(Boolean, default=True)
    
    # User statistics
    total_quizzes_taken = Column(Integer, default=0)
    total_correct_answers = Column(Integer, default=0)
    total_answers = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.0)
    
    # Crowd-sourcing contribution
    articles_flagged = Column(Integer, default=0)
    credibility_rating_given = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    responses = relationship("UserResponse", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, identifier={self.user_identifier})>"


class UserResponse(Base):
    """
    Stores complete user quiz responses and their credibility assessment
    """
    __tablename__ = "user_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Quiz performance
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    score_percentage = Column(Float, nullable=False)
    
    # Misinformation assessment by user
    user_credibility_rating = Column(Integer)  # 1-5 scale (1=definitely fake, 5=definitely credible)
    user_flagged_as_misinformation = Column(Boolean, default=False)
    user_confidence_level = Column(Integer)  # 1-5 scale
    user_comments = Column(Text)  # Optional feedback
    
    # Metadata
    time_taken_seconds = Column(Integer)  # How long they took to complete
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="responses")
    article = relationship("Article", back_populates="user_responses")
    quiz = relationship("Quiz", back_populates="user_responses")
    answers = relationship("UserAnswer", back_populates="response", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<UserResponse(id={self.id}, user_id={self.user_id}, score={self.score_percentage}%)>"


class UserAnswer(Base):
    """
    Stores individual answers to questions
    """
    __tablename__ = "user_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("user_responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    selected_option = Column(Integer, nullable=False)  # 1, 2, 3, or 4
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer)  # Time for this specific question
    
    # Metadata
    answered_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    response = relationship("UserResponse", back_populates="answers")
    question = relationship("Question", back_populates="user_answers")
    
    def __repr__(self):
        return f"<UserAnswer(id={self.id}, question_id={self.question_id}, correct={self.is_correct})>"


class MisinformationFlag(Base):
    """
    Stores crowd-sourced flags for potential misinformation
    """
    __tablename__ = "misinformation_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Flag details
    flag_type = Column(String(50))  # 'fake_news', 'misleading', 'satire', 'clickbait', etc.
    severity = Column(Integer)  # 1-5 scale
    reasoning = Column(Text)  # User's explanation
    evidence_provided = Column(Text)  # Links or references
    
    # Verification
    verified_by_admin = Column(Boolean, default=False)
    admin_verdict = Column(String(50))  # 'confirmed', 'disputed', 'false_flag'
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<MisinformationFlag(id={self.id}, article_id={self.article_id}, type={self.flag_type})>"


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Initialize database - create all tables and default data
    """
    Base.metadata.create_all(bind=engine)
    
    # Create default anonymous user if it doesn't exist
    db = SessionLocal()
    try:
        anonymous_user = db.query(User).filter(User.id == 1).first()
        if not anonymous_user:
            anonymous_user = User(
                id=1,
                user_identifier="anonymous",
                is_anonymous=True
            )
            db.add(anonymous_user)
            db.commit()
            print("✅ Created default anonymous user")
    except Exception as e:
        print(f"⚠️ Error creating anonymous user: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("✅ Database initialized successfully!")


def get_db():
    """
    Dependency for getting database session
    Use in FastAPI endpoints like: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    # Create database and tables when run directly
    print("Creating database tables...")
    init_db()
