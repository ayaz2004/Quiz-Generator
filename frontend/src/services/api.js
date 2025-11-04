const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate quiz');
    }

    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.json();
  },
};
