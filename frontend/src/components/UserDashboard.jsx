import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const UserDashboard = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchQuizHistory();
    fetchAchievements();
    fetchLeaderboard();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/quiz-history?limit=20`);
      const data = await response.json();
      setQuizHistory(data);
    } catch (error) {
      console.error('Error fetching quiz history:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}/achievements`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/leaderboard?limit=10`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊', shortLabel: 'Stats' },
    { id: 'history', label: 'Quiz History', icon: '📚', shortLabel: 'History' },
    { id: 'achievements', label: 'Achievements', icon: '🏆', shortLabel: 'Badges' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '👑', shortLabel: 'Ranks' },
  ];

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 bg-clip-text text-transparent mb-1 sm:mb-2">
            👤 Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            Welcome back, <span className="font-semibold">{dashboardData.user_identifier}</span>!
          </p>
        </div>

        {/* Tabs - Fully Responsive */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`flex-shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm md:text-base transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-lime-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <span className="mr-1 sm:mr-2">{tab.icon}</span>
              <span className="hidden xs:inline sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab key="overview" data={dashboardData} />
          )}
          {activeTab === 'history' && (
            <HistoryTab key="history" history={quizHistory} />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab key="achievements" achievements={achievements} />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab key="leaderboard" leaderboard={leaderboard} currentUserId={userId} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// ============================================================================
// OVERVIEW TAB - FULLY RESPONSIVE
// ============================================================================
const OverviewTab = ({ data }) => {
  const stats = [
    {
      label: 'Total Quizzes',
      value: data.total_quizzes,
      icon: '📝',
      color: 'from-blue-400 to-blue-600',
    },
    {
      label: 'Accuracy Rate',
      value: `${data.accuracy_rate.toFixed(1)}%`,
      icon: '🎯',
      color: 'from-green-400 to-green-600',
    },
    {
      label: 'Current Streak',
      value: `${data.streak_days} day${data.streak_days !== 1 ? 's' : ''}`,
      icon: '🔥',
      color: 'from-orange-400 to-red-600',
    },
    {
      label: 'Global Rank',
      value: data.rank ? `#${data.rank}` : 'N/A',
      icon: '👑',
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      label: 'Questions',
      value: data.total_questions_answered,
      icon: '❓',
      color: 'from-purple-400 to-purple-600',
    },
    {
      label: 'Flags',
      value: data.flags_submitted,
      icon: '🚩',
      color: 'from-red-400 to-red-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`text-2xl sm:text-3xl md:text-4xl p-2 sm:p-3 bg-gradient-to-br ${stat.color} rounded-lg sm:rounded-xl`}>
                {stat.icon}
              </div>
              <div className="text-right flex-1 ml-3">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{stat.label}</div>
              </div>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                className={`h-full bg-gradient-to-r ${stat.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart - Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base text-gray-600">Correct Answers</span>
              <span className="font-bold text-green-600 text-sm sm:text-base">{data.total_correct}</span>
            </div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(data.total_correct / data.total_questions_answered) * 100}%` }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-full bg-gradient-to-r from-green-400 to-lime-500"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base text-gray-600">Average Score</span>
              <span className="font-bold text-yellow-600 text-sm sm:text-base">{data.avg_score.toFixed(1)}%</span>
            </div>
            <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.avg_score}%` }}
                transition={{ delay: 0.9, duration: 1 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{data.total_users}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{data.credibility_contributions}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Contributions</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {data.joined_date ? new Date(data.joined_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Joined</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                {data.last_active ? new Date(data.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Last Active</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// HISTORY TAB - FULLY RESPONSIVE
// ============================================================================
const HistoryTab = ({ history }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg w-full"
    >
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        Recent Quiz History
      </h2>
      {history.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-sm sm:text-base">No quiz history yet. Take your first quiz!</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {history.map((item, index) => (
            <motion.div
              key={item.response_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:border-green-400 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base truncate">
                    {item.article_title || 'Article Quiz'}
                  </h3>
                  {item.article_url && (
                    <a
                      href={item.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-blue-500 hover:underline truncate block"
                    >
                      View Article →
                    </a>
                  )}
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                    item.score_percentage >= 80 ? 'text-green-600' :
                    item.score_percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {item.score_percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {item.correct_answers}/{item.total_questions} correct
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  {new Date(item.completed_at).toLocaleDateString()}
                </span>
                {item.credibility_rating && (
                  <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs">
                    ⭐ Rated: {item.credibility_rating}/5
                  </span>
                )}
                {item.time_taken && (
                  <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs">
                    ⏱️ {Math.floor(item.time_taken / 60)}:{String(item.time_taken % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// ACHIEVEMENTS TAB - FULLY RESPONSIVE
// ============================================================================
const AchievementsTab = ({ achievements }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Your Achievements
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          You've unlocked <span className="font-bold text-green-600">{achievements.length}</span> achievement{achievements.length !== 1 ? 's' : ''}! 🎉
        </p>
      </div>

      {achievements.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 shadow-lg text-center">
          <div className="text-5xl sm:text-6xl md:text-7xl mb-4">🏆</div>
          <p className="text-gray-500 text-sm sm:text-base">Complete quizzes to unlock achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: 'spring' }}
              whileHover={{ y: -10, rotate: 2, scale: 1.05, transition: { duration: 0.2 } }}
              className="relative"
            >
              <div className={`bg-gradient-to-br ${achievement.color} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-xl text-white overflow-hidden h-full min-h-[180px] sm:min-h-[200px]`}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 text-4xl sm:text-5xl md:text-6xl opacity-20"
                >
                  {achievement.icon}
                </motion.div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">{achievement.icon}</div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">{achievement.title}</h3>
                  <p className="text-xs sm:text-sm opacity-90 flex-1">{achievement.description}</p>
                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                      className="mt-3 sm:mt-4 inline-flex items-center bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm w-fit"
                    >
                      <span className="mr-1">✓</span> Unlocked
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// LEADERBOARD TAB - FULLY RESPONSIVE
// ============================================================================
const LeaderboardTab = ({ leaderboard, currentUserId }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg w-full"
    >
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
        🏆 Global Leaderboard
      </h2>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-4">👑</div>
          <p className="text-gray-500 text-sm sm:text-base">No rankings yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.map((user, index) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                index < 3
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-base sm:text-lg md:text-xl ${
                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg' :
                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : user.rank}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                  {user.user_identifier}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-1 sm:gap-2">
                  <span className="whitespace-nowrap">📝 {user.total_quizzes} quizzes</span>
                  <span className="hidden xs:inline">•</span>
                  <span className="whitespace-nowrap">🎯 {user.accuracy_rate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent">
                  {user.score}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
        <p className="text-xs sm:text-sm text-center text-gray-500">
          💡 Score = Total Quizzes × Accuracy Rate
        </p>
      </div>
    </motion.div>
  );
};

export default UserDashboard;
