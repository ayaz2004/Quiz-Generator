const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = {
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
  submitQuizResults: async (quizId, answers, credibilityRating = 3) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: quizId,
          user_id: 1, // Anonymous user
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

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },
};
