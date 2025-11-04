export default function QuizQuestion({ question, selectedAnswer, onAnswerSelect, questionNumber }) {
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50 transform transition-all duration-500 hover:shadow-3xl">
      <div className="mb-6 text-center">
        <div className="inline-block bg-gradient-to-r from-green-500 to-yellow-400 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 animate-bounce-slow">
          Question {questionNumber}
        </div>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 leading-relaxed">
          {question.question}
        </h3>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onAnswerSelect(question.id, option.id)}
              className={`w-full text-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden ${
                isSelected
                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-yellow-50 shadow-lg scale-[1.02]'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:scale-[1.01] hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 justify-center">
                <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-br from-green-500 to-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600'
                }`}>
                  {optionLabels[index]}
                </div>
                <span className={`flex-1 text-sm sm:text-base font-medium transition-colors duration-300 ${
                  isSelected ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {option.text}
                </span>
                {isSelected && (
                  <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-yellow-100/50 animate-pulse-slow"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-2">
          <span className="text-lg">💡</span>
          <span>Select your answer and navigate using the buttons below</span>
        </p>
      </div>
    </div>
  );
}
