import { useState } from 'react';

export default function UrlInput({ onGenerateQuiz }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    onGenerateQuiz(url);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 border border-white/50 transform transition-all duration-500 hover:shadow-3xl hover:-translate-y-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label 
              htmlFor="url" 
              className="block text-sm sm:text-base font-semibold text-gray-700 text-center flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🔗</span>
              <span>Enter URL to Generate Quiz</span>
            </label>
            <div className="relative group">
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="https://example.com/article"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all duration-300 text-sm sm:text-base bg-white/50 placeholder:text-gray-400 text-center"
                required
              />
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 transform origin-left transition-transform duration-300 ${isFocused ? 'scale-x-100' : 'scale-x-0'}`}></div>
            </div>
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
                  <span>Generating Your Quiz...</span>
                </>
              ) : (
                <>
                  <span>✨ Generate Quiz</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            💡 <span className="font-medium">Pro tip:</span> Paste a link to any article or blog post
          </p>
        </div>
      </div>
    </div>
  );
}
