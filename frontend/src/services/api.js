const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
  // Authentication APIs
  register: async (email, username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.detail || 'Registration failed',
        };
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  login: async (emailOrUsername, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: emailOrUsername,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.detail || 'Login failed',
        };
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  verifyUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify/${userId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Verification error:', error);
      return null;
    }
  },

  // Fetch article from URL
  fetchArticle: async (url) => {
    const response = await fetch(`${API_BASE_URL}/api/fetch-article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch article');
    }

    return response.json();
  },

  // Generate quiz from article text
  generateQuiz: async (articleText, numQuestions = 5) => {
    const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article_text: articleText,
        num_questions: numQuestions,
        focus_on_misinformation: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate quiz');
    }

    return response.json();
  },

  // Submit quiz results (auto-save to database)
  submitQuizResults: async (quizId, userId, answers, credibilityRating = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          user_id: userId,
          answers: answers.map(a => ({
            question_id: a.question_id,
            selected_option: a.selected_option,
            time_taken_seconds: null,
          })),
          user_credibility_rating: credibilityRating,
          user_flagged_as_misinformation: credibilityRating <= 2,
          user_confidence_level: 3,
          user_comments: null,
          total_time_seconds: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      return response.json();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      return null; // Fail silently
    }
  },

  // Get article statistics
  getArticleStats: async (articleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/articles/${articleId}/statistics`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  },

  // Get all articles (for browsing)
  getAllArticles: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/articles`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  // Get user statistics
  getUserStats: async (userId = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/statistics`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  },

  // Get user dashboard data
  getUserDashboard: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/dashboard`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return null;
    }
  },

  // Get user achievements
  getUserAchievements: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/achievements`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return null;
    }
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard?limit=${limit}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  // Get quiz history
  getQuizHistory: async (userId, limit = 20) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/quiz-history?limit=${limit}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      return [];
    }
  },

  // Get top flagged articles (analytics)
  getTopFlaggedArticles: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/top-flagged?limit=${limit}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching top flagged:', error);
      return [];
    }
  },

  // Get most credible articles (analytics)
  getMostCredibleArticles: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/most-credible?limit=${limit}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching most credible:', error);
      return [];
    }
  },

  // Get article flags
  getArticleFlags: async (articleId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/articles/${articleId}/flags`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Error fetching flags:', error);
      return [];
    }
  },

  // Create misinformation flag
  createFlag: async (flagData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagData),
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Error creating flag:', error);
      return null;
    }
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },
};
