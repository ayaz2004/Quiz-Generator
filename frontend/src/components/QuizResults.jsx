import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function QuizResults({ score, total, questions, selectedAnswers, onReset, quizData, isAuthenticated, userId }) {
  const [articleStats, setArticleStats] = useState(null);
  const [credibilityRating, setCredibilityRating] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRating, setUserRating] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const percentage = Math.round((score / total) * 100);

  useEffect(() => {
    // Only save results if user is authenticated
    const saveResults = async () => {
      if (!quizData?.quiz_id || !isAuthenticated || !userId) return;

      const answers = questions.map(q => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] || 0,
      }));

      const result = await api.submitQuizResults(quizData.quiz_id, answers, 3);
      if (result) {
        setCredibilityRating(result.article_credibility_score);
      }
    };

    // Fetch article statistics
    const fetchStats = async () => {
      if (!quizData?.article_id) return;
      const stats = await api.getArticleStats(quizData.article_id);
      if (stats) {
        setArticleStats(stats);
      }
    };

    saveResults();
    fetchStats();
  }, [quizData, questions, selectedAnswers, isAuthenticated, userId]);

  const handleRateArticle = async () => {
    if (!quizData?.quiz_id || isSubmitting) return;
    
    setIsSubmitting(true);
    const answers = questions.map(q => ({
      question_id: q.id,
      selected_option: selectedAnswers[q.id] || 0,
    }));

    const result = await api.submitQuizResults(quizData.quiz_id, answers, userRating);
    if (result) {
      setCredibilityRating(result.article_credibility_score);
      setShowRatingForm(false);
    }
    setIsSubmitting(false);
  };

  const getResultMessage = () => {
    if (percentage >= 80) return { text: 'Outstanding! 🎉', emoji: '🏆', color: 'from-yellow-400 to-orange-500', bgColor: 'from-yellow-50 to-orange-50' };
    if (percentage >= 60) return { text: 'Well Done! 👏', emoji: '🌟', color: 'from-green-400 to-lime-500', bgColor: 'from-green-50 to-lime-50' };
    if (percentage >= 40) return { text: 'Good Effort! 💪', emoji: '👍', color: 'from-lime-400 to-yellow-500', bgColor: 'from-lime-50 to-yellow-50' };
    return { text: 'Keep Learning! 📚', emoji: '🎯', color: 'from-green-400 to-yellow-500', bgColor: 'from-green-50 to-yellow-50' };
  };

  const result = getResultMessage();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 animate-fade-in">
      {/* Article Credibility Badge (if available) */}
      {credibilityRating !== null && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 mb-4 border border-blue-200 animate-slide-down">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌐</span>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Community Credibility Score</h4>
                <p className="text-xs text-gray-600">Based on {articleStats?.total_responses || 'crowd-sourced'} ratings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {credibilityRating.toFixed(1)}/100
                </div>
                <div className="text-xs text-gray-600">
                  {credibilityRating >= 70 ? '✅ Credible' : credibilityRating >= 40 ? '⚠️ Mixed' : '❌ Questionable'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Card */}
      <div className={`bg-gradient-to-br ${result.bgColor} backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 text-center border border-white/50 mb-8 animate-scale-in`}>
        <div className="text-6xl sm:text-7xl md:text-8xl mb-4 animate-bounce-slow">
          {result.emoji}
        </div>
        
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r ${result.color} bg-clip-text text-transparent animate-gradient`}>
          {result.text}
        </h2>
        
        <div className="mb-8">
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-3xl px-8 sm:px-12 py-6 sm:py-8 shadow-xl mb-4">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              {score}/{total}
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700">
              {percentage}% Correct
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${result.color} transition-all duration-1000 ease-out relative overflow-hidden animate-expand-width`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{score}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Correct</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{total - score}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Incorrect</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{total}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Total</div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 px-8 sm:px-12 rounded-2xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            🔄 Try Another Quiz
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Rate Article Section - Enhanced Design */}
      {!isAuthenticated ? (
        // Guest Mode - Prompt to Sign In
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-lg rounded-3xl shadow-lg p-6 mb-8 border border-yellow-200 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-4 shadow-lg">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Sign In to Rate Article Credibility
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              Only registered users can rate articles to ensure data quality for our misinformation detection model. Guest mode allows you to practice, but your responses won't be saved.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-sm sm:text-base hover:shadow-xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
            >
              <span className="text-xl">🔐</span>
              <span>Sign In to Continue</span>
            </button>
          </div>
        </div>
      ) : !showRatingForm ? (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-lg rounded-3xl shadow-lg p-6 mb-8 border border-blue-200 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <span className="text-3xl">⭐</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Help Fight Misinformation!
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              Your rating helps build a community-driven credibility database. Together, we can identify fake news! 🛡️
            </p>
            <button
              onClick={() => setShowRatingForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-sm sm:text-base hover:shadow-xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
            >
              <span>Rate Article Credibility</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 mb-8 border border-gray-200 animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-lime-600 rounded-full mb-3 shadow-lg animate-pulse-slow">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              How credible is this article?
            </h3>
            <p className="text-sm text-gray-600">
              Your assessment helps the community identify trustworthy sources
            </p>
          </div>

          {/* Rating Slider with Visual Feedback */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl sm:text-5xl animate-bounce-slow">
                {['❌', '⚠️', '⚡', '✓', '✅'][userRating - 1]}
              </span>
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                  userRating === 1 ? 'text-red-600' :
                  userRating === 2 ? 'text-orange-600' :
                  userRating === 3 ? 'text-yellow-600' :
                  userRating === 4 ? 'text-lime-600' :
                  'text-green-600'
                }`}>
                  {['Fake News', 'Mostly False', 'Mixed/Uncertain', 'Mostly Credible', 'Highly Credible'][userRating - 1]}
                </div>
                <div className="text-xs text-gray-500">
                  Rating: {userRating}/5
                </div>
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min="1"
                max="5"
                value={userRating}
                onChange={(e) => setUserRating(parseInt(e.target.value))}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-300"
                style={{
                  background: `linear-gradient(to right, 
                    rgb(220 38 38) 0%, 
                    rgb(249 115 22) 25%, 
                    rgb(234 179 8) 50%, 
                    rgb(132 204 22) 75%, 
                    rgb(22 163 74) 100%)`
                }}
              />
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  border: 4px solid ${
                    userRating === 1 ? '#dc2626' :
                    userRating === 2 ? '#f97316' :
                    userRating === 3 ? '#eab308' :
                    userRating === 4 ? '#84cc16' :
                    '#16a34a'
                  };
                  transition: all 0.2s;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 28px;
                  height: 28px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  border: 4px solid ${
                    userRating === 1 ? '#dc2626' :
                    userRating === 2 ? '#f97316' :
                    userRating === 3 ? '#eab308' :
                    userRating === 4 ? '#84cc16' :
                    '#16a34a'
                  };
                  transition: all 0.2s;
                }
              `}</style>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2 px-1">
              <span className="font-medium">❌ Fake</span>
              <span className="font-medium">⚡ Mixed</span>
              <span className="font-medium">✅ Credible</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRateArticle}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 px-6 rounded-2xl font-bold text-base hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Submit Rating</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button
              onClick={() => setShowRatingForm(false)}
              disabled={isSubmitting}
              className="sm:w-32 bg-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-semibold text-base hover:bg-gray-300 hover:shadow-md transition-all duration-300 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Your rating is anonymous and helps build a safer information ecosystem
          </p>
        </div>
      )}

      {/* Review Section */}
      <div className="space-y-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <span>Review Your Answers</span>
        </h3>
        
        {questions.map((question, index) => {
          const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
          const selectedOption = question.options.find(
            (opt) => opt.id === selectedAnswers[question.id]
          );
          const correctOption = question.options.find(
            (opt) => opt.id === question.correctAnswer
          );

          return (
            <div
              key={question.id}
              className={`bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-l-8 transition-all duration-300 hover:shadow-xl animate-slide-up ${
                isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <h4 className="text-base sm:text-lg font-bold text-gray-800 flex-1 leading-relaxed">
                  <span className={`inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-sm sm:text-base font-bold mr-2 sm:mr-3 text-center leading-7 sm:leading-8 ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {index + 1}
                  </span>
                  {question.question}
                </h4>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                    isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isCorrect ? '✓ Correct' : '✗ Wrong'}
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3 ml-0 sm:ml-11">
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Your answer: </span>
                  <span className={`font-medium text-sm sm:text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedOption?.text || 'Not answered'}
                  </span>
                </div>
                {!isCorrect && (
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-green-50 border border-green-200">
                    <span className="font-semibold text-gray-700 text-sm sm:text-base">Correct answer: </span>
                    <span className="font-medium text-green-700 text-sm sm:text-base">{correctOption?.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
