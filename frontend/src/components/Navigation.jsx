export default function Navigation({ currentView, onViewChange }) {
  const views = [
    { id: 'quiz', label: 'Quiz Generator', icon: '🧠' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'browse', label: 'Browse Articles', icon: '📚' },
  ];

  return (
    <nav className="mb-8 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-2 inline-flex gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 ${
              currentView === view.id
                ? 'bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white shadow-lg scale-105'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{view.icon}</span>
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
