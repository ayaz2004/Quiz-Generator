#  Database Structure Documentation

## Overview
This project uses **SQLAlchemy ORM** with **SQLite** for development (easily switchable to PostgreSQL/MySQL for production).

The database is designed for **crowd-sourced misinformation detection** through interactive quizzes.

---

##  Database Tables

### 1. **Articles** (`articles`)
Stores analyzed articles

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| url | String(500) | Article URL (unique) |
| title | String(500) | Article title |
| content | Text | Full article text |
| summary | Text | 3-sentence summary |
| word_count | Integer | Total words |
| source_domain | String(200) | Website domain |
| **credibility_score** | Float | 0-100 credibility score |
| total_responses | Integer | Total user responses |
| flagged_as_misinformation | Integer | Count of misinformation flags |
| flagged_as_credible | Integer | Count of credible flags |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Relationships:**
- One-to-Many with `quizzes`
- One-to-Many with `user_responses`

---

### 2. **Quizzes** (`quizzes`)
Generated quizzes for articles

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| article_id | Integer (FK) | Reference to article |
| title | String(300) | Quiz title |
| num_questions | Integer | Number of questions |
| focus_on_misinformation | Boolean | Critical thinking focus |
| created_at | DateTime | Creation timestamp |

**Relationships:**
- Many-to-One with `articles`
- One-to-Many with `questions`
- One-to-Many with `user_responses`

---

### 3. **Questions** (`questions`)
Individual quiz questions

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| quiz_id | Integer (FK) | Reference to quiz |
| question_number | Integer | Question order |
| question_text | Text | The question |
| option_1 | Text | First option |
| option_2 | Text | Second option |
| option_3 | Text | Third option |
| option_4 | Text | Fourth option |
| correct_option | Integer | Correct answer (1-4) |
| is_fact_check_question | Boolean | Tests fact-checking |
| tests_critical_thinking | Boolean | Tests critical thinking |
| created_at | DateTime | Creation timestamp |

**Relationships:**
- Many-to-One with `quizzes`
- One-to-Many with `user_answers`

---

### 4. **Users** (`users`)
User information for crowd-sourcing

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| user_identifier | String(100) | Username/email/anonymous ID |
| is_anonymous | Boolean | Anonymous user flag |
| total_quizzes_taken | Integer | Quiz count |
| total_correct_answers | Integer | Correct answers count |
| total_answers | Integer | Total answers |
| accuracy_rate | Float | Accuracy percentage |
| articles_flagged | Integer | Articles flagged count |
| credibility_rating_given | Integer | Ratings given count |
| created_at | DateTime | Creation timestamp |
| last_active | DateTime | Last activity timestamp |

**Relationships:**
- One-to-Many with `responses`

---

### 5. **User Responses** (`user_responses`)
Complete quiz submissions with credibility assessments

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| user_id | Integer (FK) | Reference to user |
| article_id | Integer (FK) | Reference to article |
| quiz_id | Integer (FK) | Reference to quiz |
| total_questions | Integer | Question count |
| correct_answers | Integer | Correct count |
| score_percentage | Float | Score % |
| **user_credibility_rating** | Integer | 1-5 credibility rating |
| **user_flagged_as_misinformation** | Boolean | Misinformation flag |
| user_confidence_level | Integer | 1-5 confidence |
| user_comments | Text | Optional feedback |
| time_taken_seconds | Integer | Time to complete |
| completed_at | DateTime | Completion timestamp |

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `articles`
- Many-to-One with `quizzes`
- One-to-Many with `answers`

---

### 6. **User Answers** (`user_answers`)
Individual question answers

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| response_id | Integer (FK) | Reference to response |
| question_id | Integer (FK) | Reference to question |
| selected_option | Integer | Selected answer (1-4) |
| is_correct | Boolean | Correctness flag |
| time_taken_seconds | Integer | Time for question |
| answered_at | DateTime | Answer timestamp |

**Relationships:**
- Many-to-One with `user_responses`
- Many-to-One with `questions`

---

### 7. **Misinformation Flags** (`misinformation_flags`)
Crowd-sourced misinformation reports

| Column | Type | Description |
|--------|------|-------------|
| id | Integer (PK) | Unique identifier |
| article_id | Integer (FK) | Reference to article |
| user_id | Integer (FK) | Reference to user |
| flag_type | String(50) | Type of misinformation |
| severity | Integer | 1-5 severity |
| reasoning | Text | User explanation |
| evidence_provided | Text | Supporting evidence |
| verified_by_admin | Boolean | Admin verification |
| admin_verdict | String(50) | Admin decision |
| created_at | DateTime | Creation timestamp |

**Flag Types:**
- `fake_news`
- `misleading`
- `satire`
- `clickbait`
- `out_of_context`
- `manipulated_content`

---

##  Key Workflows

### **1. Article Analysis Flow**
```
User submits URL 
→ Article fetched & stored
→ Quiz generated
→ Users take quiz
→ Credibility scores calculated
→ Community consensus formed
```

### **2. Credibility Score Calculation**
```python
credibility_score = (Σ(user_rating × user_confidence)) / Σ(user_confidence) × 20
# Scaled to 0-100
```

### **3. Community Consensus**
- **70-100**: High Credibility
- **40-69**: Disputed
- **0-39**: Likely Misinformation

---

## 🔧 Database Setup

### **Development (SQLite)**
```python
DATABASE_URL = "sqlite:///./misinformation_detection.db"
```

### **Production (PostgreSQL)**
```python
DATABASE_URL = "postgresql://user:password@localhost/misinformation_db"
```

### **Initialize Database**
```bash
cd backend
python database.py
```

---

## 📈 Analytics Queries

The system supports:
- Top flagged articles
- Most credible articles
- User statistics
- Article statistics
- Community consensus tracking

---

## 🔒 Data Privacy

- Anonymous users supported
- User identifiers hashed
- No personal data required
- GDPR compliant design

---

## 🚀 Scalability

- SQLite for development
- PostgreSQL for production
- Indexes on frequently queried fields
- Optimized for crowd-sourcing at scale
