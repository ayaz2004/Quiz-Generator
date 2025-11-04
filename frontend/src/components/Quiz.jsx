import { useState } from 'react';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';

export default function Quiz({ quizData, onReset }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [direction, setDirection] = useState('forward');

  const handleAnswerSelect = (questionId, answerId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerId,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setDirection('forward');
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection('backward');
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  if (showResults) {
    return (
      <QuizResults
        score={calculateScore()}
        total={quizData.questions.length}
        questions={quizData.questions}
        selectedAnswers={selectedAnswers}
        onReset={onReset}
      />
    );
  }

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
      {/* Quiz Header Card */}
      <div className="w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-4 sm:p-6 mb-6 border border-white/50 animate-slide-down">
        <div className="flex flex-col items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent text-center">
            {quizData.title}
          </h2>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
              📝 {answeredCount}/{quizData.questions.length} answered
            </span>
            <span className="text-xs sm:text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
              {currentQuestion + 1} of {quizData.questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-green-500 via-lime-500 to-yellow-500 transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          <span className="absolute -top-1 text-xs font-bold text-green-600 transition-all duration-500" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Question Card with Animation */}
      <div key={currentQuestion} className={`w-full animate-${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}`}>
        <QuizQuestion
          question={question}
          selectedAnswer={selectedAnswers[question.id]}
          onAnswerSelect={handleAnswerSelect}
          questionNumber={currentQuestion + 1}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="w-full flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:bg-white hover:border-green-500 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Back</span>
        </button>

        {currentQuestion === quizData.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length !== quizData.questions.length}
            className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              🎯 Submit Quiz
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white rounded-2xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="hidden sm:inline">Next Question</span>
              <span className="sm:hidden">Next</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        )}
      </div>
    </div>
  );
}
