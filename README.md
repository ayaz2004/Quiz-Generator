# 🎯 Crowd-Sourced Misinformation Detection Platform

A full-stack application that uses interactive quizzes and crowd-sourcing to detect misinformation in news articles.

## 🌟 Key Features

### Core Functionality
- ✅ **Article Analysis**: Fetch and analyze articles from any URL
- 📊 **AI-Powered Quiz Generation**: Create critical thinking questions using LLM
- 👥 **Crowd-Sourcing**: Aggregate user assessments for credibility scoring
- 🚩 **Misinformation Flagging**: Community-driven content moderation
- 📈 **Analytics Dashboard**: Track credibility trends and community consensus

### Misinformation Detection Focus
- Fact vs Opinion identification
- Source credibility evaluation
- Logical fallacy detection
- Critical thinking assessment
- Evidence-based reasoning

---

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── main.py              # Main FastAPI application
├── database.py          # SQLAlchemy models & DB setup
├── schemas.py           # Pydantic request/response schemas
├── crud.py              # Database CRUD operations
├── llm_service.py       # LLM quiz generation service
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── misinformation_detection.db  # SQLite database
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── components/      # React components
│   ├── services/        # API integration
│   └── App.jsx          # Main app component
├── package.json
└── .env
```

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Groq API Key 

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd "Fake News"
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo GROQ_API_KEY=your_groq_api_key_here > .env

# Initialize database
python database.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo VITE_API_URL=http://localhost:8000 > .env
```

---

## 🚀 Running the Application

### Start Backend
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## 💻 Usage Flow

### 1. Fetch Article
- User pastes article URL
- System fetches and displays summary
- Word count and metadata shown

### 2. Generate Quiz
- User selects number of questions (1-10)
- AI generates critical thinking questions
- Questions focus on fact-checking and source evaluation

### 3. Take Quiz
- User answers questions
- System tracks time and selections

### 4. Submit Assessment
- User rates article credibility (1-5 scale)
- Optional: Flag as misinformation
- Provide confidence level
- Add comments/evidence

### 5. View Results
- See quiz score
- Compare with community consensus
- View article credibility score
- Understand community verdict

---

## 🗄️ Database Schema

### Tables
1. **articles** - Stores analyzed articles
2. **quizzes** - Generated quizzes
3. **questions** - Quiz questions
4. **users** - User profiles (anonymous supported)
5. **user_responses** - Quiz submissions with credibility ratings
6. **user_answers** - Individual answer tracking
7. **misinformation_flags** - Community-reported issues

**See [DATABASE_DOCUMENTATION.md](backend/DATABASE_DOCUMENTATION.md) for detailed schema**

---

## 📡 API Endpoints

### Articles
- `POST /api/fetch-article` - Fetch and store article
- `GET /api/articles/{id}` - Get article details
- `GET /api/articles/{id}/statistics` - Get article stats

### Quizzes
- `POST /api/generate-quiz` - Generate quiz
- `GET /api/quizzes/{id}` - Get quiz details

### Users
- `POST /api/users` - Create/get user
- `GET /api/users/{id}` - Get user details

### Responses
- `POST /api/submit-quiz` - Submit quiz + credibility rating

### Flags
- `POST /api/flags` - Flag misinformation
- `GET /api/articles/{id}/flags` - Get article flags

### Analytics
- `GET /api/analytics/top-flagged` - Most flagged articles
- `GET /api/analytics/most-credible` - Most credible articles

**Full API documentation**: http://localhost:8000/docs

---

## 🎨 Frontend Components

### UrlInput
- Article URL input
- Article summary display
- Question number selector
- Quiz generation trigger

### Quiz
- Question display with navigation
- Progress tracking
- Answer selection
- Time tracking

### QuizResults
- Score display
- Answer review
- Credibility assessment form
- Community consensus

---

## 🔧 Configuration

### Backend (.env)
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=sqlite:///./misinformation_detection.db
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📊 Credibility Scoring Algorithm

```
Article Credibility Score = 
  (Σ(user_rating × user_confidence)) / Σ(user_confidence) × 20

Where:
- user_rating: 1-5 scale (1=fake, 5=credible)
- user_confidence: 1-5 scale
- Result scaled to 0-100
```

### Consensus Categories
- **70-100**: High Credibility ✅
- **40-69**: Disputed ⚠️
- **0-39**: Likely Misinformation ❌

---

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **Groq**: Fast LLM inference
- **LangChain**: LLM framework
- **BeautifulSoup**: Web scraping
- **Pydantic**: Data validation

### Frontend
- **React**: UI library
- **Vite**: Build tool
- **Tailwind CSS v4**: Styling
- **Custom animations**: Smooth UX

### Database
- **SQLite** (Development)
- **PostgreSQL** (Production-ready)

---

## 🔐 Security & Privacy

- Anonymous user support
- No personal data required
- GDPR compliant design
- Hashed user identifiers
- Secure API endpoints

---

## 📈 Future Enhancements

- [ ] Real-time fact-checking API integration
- [ ] ML model for automated credibility prediction
- [ ] Source verification system
- [ ] User reputation scoring
- [ ] Social sharing features
- [ ] Browser extension
- [ ] Mobile app

---

## 🤝 Contributing

This is a crowd-sourced platform - your contributions matter!

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 💡 Use Cases

### Education
- Teach media literacy
- Train critical thinking
- Demonstrate fact-checking

### Research
- Study misinformation spread
- Analyze credibility patterns
- Community consensus research

### Journalism
- Pre-publication verification
- Source credibility checks
- Fact-checking assistance

---

## 🐛 Troubleshooting

### Backend Issues
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Reset database
python database.py

# Check API key
echo $GROQ_API_KEY
```

### Frontend Issues
```bash
# Clear cache
npm run dev -- --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues
```bash
# Delete and recreate
rm misinformation_detection.db
python database.py
```

---

## 📞 Support

For issues or questions:
- Check [DATABASE_DOCUMENTATION.md](backend/DATABASE_DOCUMENTATION.md)
- Review API docs at `/docs`
- Open GitHub issue

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Built with ❤️ for fighting misinformation through community collaboration**
