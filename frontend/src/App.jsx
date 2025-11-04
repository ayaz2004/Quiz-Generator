import { useState } from 'react';
import UrlInput from './components/UrlInput';
import Quiz from './components/Quiz';

export default function App() {
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [quizData, setQuizData] = useState(null);

  const handleGenerateQuiz = (data, url) => {
    setQuizData(data);
    setCurrentUrl(url);
    setQuizGenerated(true);
  };

  const handleReset = () => {
    setQuizGenerated(false);
    setCurrentUrl('');
    setQuizData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-lime-50 relative overflow-hidden flex items-center justify-center">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full container mx-auto px-4 py-8 sm:py-12 relative z-10">
        <header className="text-center mb-8 sm:mb-12 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 bg-clip-text text-transparent mb-3 animate-gradient">
                🧠 Quiz Generator
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 rounded-full transform scale-x-0 animate-scale-x"></div>
            </div>
          </div>
          {/* <p className="text-gray-700 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Transform any article into an engaging quiz experience ✨
          </p> */}                    
        </header>

        <main className="animate-slide-up flex justify-center">
          {!quizGenerated ? (
            <UrlInput onGenerateQuiz={handleGenerateQuiz} />
          ) : (
            quizData && <Quiz quizData={quizData} onReset={handleReset} />
          )}
        </main>

        {currentUrl && quizGenerated && (
          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-700 animate-fade-in px-4">
            <span className="inline-block bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              📄 Quiz generated from: <span className="font-semibold text-green-600">{currentUrl}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
