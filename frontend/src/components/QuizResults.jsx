export default function QuizResults({ score, total, questions, selectedAnswers, onReset }) {
  const percentage = Math.round((score / total) * 100);

  const getResultMessage = () => {
    if (percentage >= 80) return { text: 'Outstanding! 🎉', emoji: '🏆', color: 'from-yellow-400 to-orange-500', bgColor: 'from-yellow-50 to-orange-50' };
    if (percentage >= 60) return { text: 'Well Done! 👏', emoji: '🌟', color: 'from-green-400 to-lime-500', bgColor: 'from-green-50 to-lime-50' };
    if (percentage >= 40) return { text: 'Good Effort! 💪', emoji: '👍', color: 'from-lime-400 to-yellow-500', bgColor: 'from-lime-50 to-yellow-50' };
    return { text: 'Keep Learning! 📚', emoji: '🎯', color: 'from-green-400 to-yellow-500', bgColor: 'from-green-50 to-yellow-50' };
  };

  const result = getResultMessage();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 animate-fade-in">
      {/* Results Card */}
      <div className={`bg-gradient-to-br ${result.bgColor} backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 text-center border border-white/50 mb-8 animate-scale-in`}>
        <div className="text-6xl sm:text-7xl md:text-8xl mb-4 animate-bounce-slow">
          {result.emoji}
        </div>
        
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r ${result.color} bg-clip-text text-transparent animate-gradient`}>
          {result.text}
        </h2>
        
        <div className="mb-8">
          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-3xl px-8 sm:px-12 py-6 sm:py-8 shadow-xl mb-4">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              {score}/{total}
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700">
              {percentage}% Correct
            </div>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative mb-8 max-w-md mx-auto">
          <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${result.color} transition-all duration-1000 ease-out relative overflow-hidden animate-expand-width`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
            </div>
          </div>
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{score}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Correct</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{total - score}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Incorrect</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-md">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{total}</div>
            <div className="text-xs sm:text-sm text-gray-700 font-medium">Total</div>
          </div>
        </div>

        <button
          onClick={onReset}
          className="bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 px-8 sm:px-12 rounded-2xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            🔄 Try Another Quiz
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-lime-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <span>Review Your Answers</span>
        </h3>
        
        {questions.map((question, index) => {
          const isCorrect = selectedAnswers[question.id] === question.correctAnswer;
          const selectedOption = question.options.find(
            (opt) => opt.id === selectedAnswers[question.id]
          );
          const correctOption = question.options.find(
            (opt) => opt.id === question.correctAnswer
          );

          return (
            <div
              key={question.id}
              className={`bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-l-8 transition-all duration-300 hover:shadow-xl animate-slide-up ${
                isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <h4 className="text-base sm:text-lg font-bold text-gray-800 flex-1 leading-relaxed">
                  <span className={`inline-block w-7 h-7 sm:w-8 sm:h-8 rounded-full text-white text-sm sm:text-base font-bold mr-2 sm:mr-3 text-center leading-7 sm:leading-8 ${
                    isCorrect ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {index + 1}
                  </span>
                  {question.question}
                </h4>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                    isCorrect
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isCorrect ? '✓ Correct' : '✗ Wrong'}
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3 ml-0 sm:ml-11">
                <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">Your answer: </span>
                  <span className={`font-medium text-sm sm:text-base ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {selectedOption?.text || 'Not answered'}
                  </span>
                </div>
                {!isCorrect && (
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-green-50 border border-green-200">
                    <span className="font-semibold text-gray-700 text-sm sm:text-base">Correct answer: </span>
                    <span className="font-medium text-green-700 text-sm sm:text-base">{correctOption?.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
