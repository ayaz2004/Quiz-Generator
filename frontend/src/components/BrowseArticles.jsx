import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function BrowseArticles({ userId, isAuthenticated }) {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagFormOpen, setFlagFormOpen] = useState(false);
  const [flagData, setFlagData] = useState({
    flag_type: 'misleading',
    severity: 'medium',
    reasoning: '',
    evidence: ''
  });

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const data = await api.getAllArticles();
      setArticles(data);
      setLoading(false);
    };

    fetchArticles();
  }, []);

  const handleViewDetails = async (article) => {
    setSelectedArticle(article);
    const flagData = await api.getArticleFlags(article.id);
    setFlags(flagData);
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated || !userId) {
      alert('❌ Please sign in to flag articles.');
      return;
    }
    
    console.log('🚩 Submitting flag for article:', selectedArticle.id, 'by user:', userId);
    
    const flagPayload = {
      article_id: selectedArticle.id,
      user_id: userId,
      flag_type: flagData.flag_type,
      severity: flagData.severity,
      reasoning: flagData.reasoning,
      evidence: flagData.evidence || null
    };
    const success = await api.createFlag(flagPayload);
    if (success) {
      alert('✅ Flag submitted successfully! Thank you for helping fight misinformation.');
      setFlagFormOpen(false);
      setFlagData({
        flag_type: 'misleading',
        severity: 'medium',
        reasoning: '',
        evidence: ''
      });
      // Refresh flags
      const updatedFlags = await api.getArticleFlags(selectedArticle.id);
      setFlags(updatedFlags);
      console.log('✅ Flag submitted successfully');
    } else {
      alert('❌ Failed to submit flag. Please try again.');
    }
  };

  const getCredibilityColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCredibilityBg = (score) => {
    if (score >= 70) return 'from-green-50 to-lime-50';
    if (score >= 40) return 'from-yellow-50 to-amber-50';
    return 'from-red-50 to-orange-50';
  };

  const getCredibilityBorder = (score) => {
    if (score >= 70) return 'border-green-200';
    if (score >= 40) return 'border-yellow-200';
    return 'border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600 font-medium">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-8 text-center">
        📚 Browse Analyzed Articles
      </h2>

      {articles.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-12 text-center">
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-gray-600 text-lg">No articles analyzed yet. Start by generating your first quiz!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`bg-gradient-to-br ${getCredibilityBg(article.credibility_score)} rounded-3xl shadow-xl p-6 border ${getCredibilityBorder(article.credibility_score)} hover:shadow-2xl transition-all duration-300 cursor-pointer animate-slide-up`}
              onClick={() => handleViewDetails(article)}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {article.title || 'Untitled Article'}
                  </h3>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mb-3 block truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {article.url}
                  </a>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCredibilityColor(article.credibility_score)} bg-white/80`}>
                      📊 Credibility: {article.credibility_score.toFixed(0)}/100
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm bg-white/80 text-gray-700">
                      👥 {article.total_responses} responses
                    </span>
                    {article.flagged_as_misinformation > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-medium">
                        🚩 {article.flagged_as_misinformation} flags
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="bg-gradient-to-r from-green-600 to-lime-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(article);
                  }}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Details Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedArticle(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-lime-600 text-white p-6 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedArticle.title || 'Untitled Article'}</h3>
                  <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" className="text-white/90 hover:underline text-sm break-all">
                    {selectedArticle.url}
                  </a>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="bg-white/20 hover:bg-white/30 w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-all ml-4"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-lime-50 rounded-2xl p-4 text-center border border-green-200">
                  <div className={`text-3xl font-bold ${getCredibilityColor(selectedArticle.credibility_score)}`}>
                    {selectedArticle.credibility_score.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Credibility Score</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600">{selectedArticle.total_responses}</div>
                  <div className="text-xs text-gray-600 mt-1">Community Ratings</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-200">
                  <div className="text-3xl font-bold text-red-600">{selectedArticle.flagged_as_misinformation}</div>
                  <div className="text-xs text-gray-600 mt-1">Flags</div>
                </div>
              </div>

              {/* Flag This Article Button */}
              <button
                onClick={() => setFlagFormOpen(!flagFormOpen)}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 mb-6"
              >
                🚩 {flagFormOpen ? 'Cancel Flag' : 'Flag This Article'}
              </button>

              {/* Flag Form */}
              {flagFormOpen && (
                <form onSubmit={handleSubmitFlag} className="bg-red-50 rounded-2xl p-6 mb-6 border border-red-200 space-y-4">
                  <h4 className="font-bold text-gray-800 mb-4">Report Misinformation</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Flag Type</label>
                    <select
                      value={flagData.flag_type}
                      onChange={(e) => setFlagData({ ...flagData, flag_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="misleading">Misleading Information</option>
                      <option value="false_claim">False Claim</option>
                      <option value="biased">Heavily Biased</option>
                      <option value="clickbait">Clickbait</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <select
                      value={flagData.severity}
                      onChange={(e) => setFlagData({ ...flagData, severity: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reasoning</label>
                    <textarea
                      value={flagData.reasoning}
                      onChange={(e) => setFlagData({ ...flagData, reasoning: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                      placeholder="Why do you believe this article is problematic?"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (Optional)</label>
                    <textarea
                      value={flagData.evidence}
                      onChange={(e) => setFlagData({ ...flagData, evidence: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none"
                      placeholder="Any supporting evidence or sources?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Submit Flag 🚩
                  </button>
                </form>
              )}

              {/* Flag History */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📋</span> Flag History ({flags.length})
                </h4>
                {flags.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-2xl">No flags reported yet</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {flags.map((flag) => (
                      <div key={flag.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {flag.flag_type.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            flag.severity === 'critical' ? 'bg-red-200 text-red-800' :
                            flag.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                            flag.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {flag.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{flag.reasoning}</p>
                        {flag.evidence && (
                          <p className="text-xs text-gray-500 bg-white rounded-lg p-2 border border-gray-200">
                            <strong>Evidence:</strong> {flag.evidence}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(flag.created_at).toLocaleDateString()} at {new Date(flag.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
