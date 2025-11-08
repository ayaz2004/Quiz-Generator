import { useState } from 'react';
import { api } from '../services/api';

export default function UrlInput({ onGenerateQuiz }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');
  const [articleData, setArticleData] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const handleFetchArticle = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setArticleData(null);

    try {
      const data = await api.fetchArticle(url);
      setArticleData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!articleData) return;

    setIsGeneratingQuiz(true);
    setError('');

    try {
      const quizData = await api.generateQuiz(articleData.content, numQuestions);
      onGenerateQuiz(quizData, url);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/50 transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-1">
        {!articleData ? (
          <form onSubmit={handleFetchArticle} className="space-y-6">
            <div className="space-y-3">
              <label 
                htmlFor="url" 
                className="block text-sm sm:text-base font-semibold text-gray-700 text-center flex items-center justify-center gap-2"
              >
                <span className="text-2xl">🔗</span>
                <span>Enter URL to Fetch Article</span>
              </label>
              <div className="relative group">
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="https://example.com/article"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-sm sm:text-base bg-white/50 placeholder:text-gray-400 text-center"
                  required
                />
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 transform origin-left transition-transform duration-300 ${isFocused ? 'scale-x-100' : 'scale-x-0'}`}></div>
              </div>
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-slide-down">
                  ⚠️ {error}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 px-6 rounded-2xl font-semibold text-sm sm:text-base hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Fetching Article...</span>
                  </>
                ) : (
                  <>
                    <span>📄 Fetch Article</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600 text-center">
                💡 <span className="font-medium">Pro tip:</span> Paste a link to any article or blog post
              </p>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Article Summary */}
            <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📰</span>
                <h3 className="text-lg font-bold text-gray-800">Article Summary</h3>
              </div>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-3">
                {articleData.summary}
              </p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <span className="bg-white px-3 py-1.5 rounded-full text-gray-600 font-medium">
                  📊 {articleData.word_count} words
                </span>
                <span className="bg-white px-3 py-1.5 rounded-full text-green-600 font-medium">
                  ✅ Article Loaded
                </span>
                {articleData.total_responses > 0 && (
                  <span className="bg-blue-50 px-3 py-1.5 rounded-full text-blue-600 font-medium border border-blue-200">
                    👥 {articleData.total_responses} {articleData.total_responses === 1 ? 'person has' : 'people have'} analyzed this
                  </span>
                )}
                {articleData.credibility_score && (
                  <span className={`px-3 py-1.5 rounded-full font-medium border ${
                    articleData.credibility_score >= 70 
                      ? 'bg-green-50 text-green-600 border-green-200' 
                      : articleData.credibility_score >= 40
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {articleData.credibility_score >= 70 ? '✅' : articleData.credibility_score >= 40 ? '⚠️' : '❌'} Credibility: {articleData.credibility_score.toFixed(0)}/100
                  </span>
                )}
              </div>
            </div>

            {/* Number of Questions Selector */}
            <div className="space-y-3">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 text-center">
                <span className="text-xl mr-2">🎯</span>
                How many questions do you want?
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl transition-all hover:scale-110"
                >
                  −
                </button>
                <div className="bg-gradient-to-r from-green-600 to-lime-600 text-white px-8 py-3 rounded-2xl font-bold text-2xl min-w-[100px] text-center shadow-lg">
                  {numQuestions}
                </div>
                <button
                  onClick={() => setNumQuestions(Math.min(10, numQuestions + 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl transition-all hover:scale-110"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Select between 1-10 questions
              </p>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-slide-down">
                ⚠️ {error}
              </div>
            )}

            {/* Generate Quiz Button */}
            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="w-full bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 px-6 rounded-2xl font-semibold text-sm sm:text-base hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isGeneratingQuiz ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating {numQuestions} Questions...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate Quiz ({numQuestions} Questions)</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Try Another URL Button */}
            <button
              onClick={() => {
                setArticleData(null);
                setUrl('');
                setError('');
                setNumQuestions(5);
              }}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-2xl font-semibold text-sm hover:bg-gray-50 transition-all duration-300"
            >
              🔄 Try Another Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
