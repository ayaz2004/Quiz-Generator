export default function Navigation({ currentView, onViewChange, isAuthenticated }) {
  const views = [
    { id: 'quiz', label: 'Quiz Generator', icon: '🧠', restricted: false },
    { id: 'dashboard', label: 'Dashboard', icon: '👤', restricted: true },
    { id: 'analytics', label: 'Analytics', icon: '📊', restricted: true },
    { id: 'browse', label: 'Browse Articles', icon: '📚', restricted: true },
  ];

  return (
    <nav className="mb-8 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-2 inline-flex gap-2 flex-wrap justify-center">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            disabled={view.restricted && !isAuthenticated}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center gap-2 relative ${
              currentView === view.id
                ? 'bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white shadow-lg scale-105'
                : view.restricted && !isAuthenticated
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl">{view.icon}</span>
            <span className="hidden sm:inline">{view.label}</span>
            {view.restricted && !isAuthenticated && (
              <span className="text-lg">🔒</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

