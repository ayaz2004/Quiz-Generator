import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Analytics() {
  const [userStats, setUserStats] = useState(null);
  const [topFlagged, setTopFlagged] = useState([]);
  const [mostCredible, setMostCredible] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const [user, flagged, credible] = await Promise.all([
        api.getUserStats(),
        api.getTopFlaggedArticles(5),
        api.getMostCredibleArticles(5),
      ]);
      setUserStats(user);
      setTopFlagged(flagged);
      setMostCredible(credible);
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📊</div>
          <p className="text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-8 text-center">
        📊 Community Analytics
      </h2>

      {/* User Statistics Card */}
      {userStats && (
        <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 border border-green-200 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-lime-600 rounded-full flex items-center justify-center text-2xl shadow-lg">
              👤
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Your Statistics</h3>
              <p className="text-sm text-gray-600">Anonymous User</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/80 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{userStats.total_quizzes_taken}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Quizzes Taken</div>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{userStats.accuracy_rate.toFixed(0)}%</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Accuracy</div>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{userStats.total_correct_answers}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Correct Answers</div>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{userStats.articles_flagged}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Articles Flagged</div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Flagged Articles */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-red-200 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-xl shadow-lg">
              🚩
            </div>
            <h3 className="text-xl font-bold text-gray-800">Most Flagged Articles</h3>
          </div>

          {topFlagged.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No flagged articles yet</p>
          ) : (
            <div className="space-y-3">
              {topFlagged.map((article, index) => (
                <div key={article.id} className="bg-red-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate">
                        {article.title || 'Untitled Article'}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                          🚩 {article.flagged_as_misinformation} flags
                        </span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          Score: {article.credibility_score.toFixed(0)}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Credible Articles */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-green-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-lime-600 rounded-full flex items-center justify-center text-xl shadow-lg">
              ✅
            </div>
            <h3 className="text-xl font-bold text-gray-800">Most Credible Articles</h3>
          </div>

          {mostCredible.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No articles rated yet</p>
          ) : (
            <div className="space-y-3">
              {mostCredible.map((article, index) => (
                <div key={article.id} className="bg-green-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate">
                        {article.title || 'Untitled Article'}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          ✅ Score: {article.credibility_score.toFixed(0)}/100
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          👥 {article.total_responses} ratings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-gray-800 mb-2">How Community Analytics Work</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every quiz you complete contributes to our crowd-sourced fact-checking database. 
              Articles with low credibility scores or multiple flags help identify potential misinformation, 
              while highly-rated articles build trust in reliable sources. Together, we're creating a safer information ecosystem! 🛡️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
