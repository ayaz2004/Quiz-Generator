import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import UrlInput from './components/UrlInput';
import Quiz from './components/Quiz';
import Analytics from './components/Analytics';
import BrowseArticles from './components/BrowseArticles';
import UserDashboard from './components/UserDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('quiz');
  const [quizGenerated, setQuizGenerated] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authView, setAuthView] = useState('signin'); // 'signin' or 'signup'

  // Check authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuthenticated');
    const storedUser = localStorage.getItem('user');
    const storedUserId = localStorage.getItem('userId');

    // Check if user is in guest mode
    if (storedAuth === 'false' || storedUserId === 'guest') {
      setIsAuthenticated(false);
      setUser(null);
      setIsGuestMode(true);
      setCheckingAuth(false);
      return;
    }

    // Check if user is authenticated
    if (storedAuth === 'true' && storedUser && storedUserId !== 'guest') {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        setIsGuestMode(false);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        localStorage.clear();
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsGuestMode(false);
  };

  const handleSkipAuth = () => {
    // Set guest mode
    localStorage.setItem('isAuthenticated', 'false');
    localStorage.setItem('userId', 'guest');
    setIsAuthenticated(false);
    setUser(null);
    setIsGuestMode(true);
    setCheckingAuth(false); // Ensure we exit loading state
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setIsGuestMode(false);
    setCurrentView('quiz');
    setQuizGenerated(false);
  };

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

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-lime-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth screen if not authenticated and not in guest mode
  if (!isAuthenticated && !isGuestMode) {
    if (authView === 'signin') {
      return (
        <SignIn
          onAuthSuccess={handleAuthSuccess}
          onSwitchToSignUp={() => setAuthView('signup')}
          onSkipAuth={handleSkipAuth}
        />
      );
    } else {
      return (
        <SignUp
          onAuthSuccess={handleAuthSuccess}
          onSwitchToSignIn={() => setAuthView('signin')}
          onSkipAuth={handleSkipAuth}
        />
      );
    }
  }

  // Determine which views guest users can access
  const restrictedViews = ['dashboard', 'analytics', 'browse'];

  const handleViewChange = (view) => {
    if (isGuestMode && restrictedViews.includes(view)) {
      alert('Please sign in to access this feature. Guest users can only take quizzes (responses not saved for credibility analysis).');
      return;
    }
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-lime-50 relative overflow-hidden">
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 bg-clip-text text-transparent mb-3 animate-gradient flex items-center justify-center gap-3">
                <span className="text-5xl sm:text-6xl lg:text-7xl">🧠</span>
                Misinformation Detection Hub
              </h1>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 rounded-full transform scale-x-0 animate-scale-x"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <p className="text-gray-700 text-base sm:text-lg flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              Crowd-sourced fact-checking through interactive quizzes
            </p>
          </div>

          {/* User Status Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4">
            {isAuthenticated ? (
              <>
                <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  {user?.username || user?.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-100 text-red-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">🚪</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="bg-yellow-100 text-yellow-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span className="text-xl">🔓</span>
                  Guest Mode - Quizzes not saved
                </div>
                <button
                  onClick={() => {
                    localStorage.clear();
                    setAuthView('signin'); // Reset to signin page
                    window.location.reload();
                  }}
                  className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <span className="text-xl">🔐</span>
                  Sign In
                </button>
              </>
            )}
          </div>
          
          {/* Navigation */}
          <div className="mt-8">
            <Navigation 
              currentView={currentView} 
              onViewChange={handleViewChange}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </header>

        <main className="animate-slide-up flex justify-center">
          {currentView === 'quiz' && (
            <>
              {!quizGenerated ? (
                <UrlInput 
                  onGenerateQuiz={handleGenerateQuiz}
                  isAuthenticated={isAuthenticated}
                />
              ) : (
                quizData && (
                  <Quiz 
                    quizData={quizData} 
                    onReset={handleReset}
                    isAuthenticated={isAuthenticated}
                    userId={user?.id}
                  />
                )
              )}
            </>
          )}
          
          {currentView === 'dashboard' && isAuthenticated && user && (
            <UserDashboard userId={user.id} />
          )}
          
          {currentView === 'analytics' && isAuthenticated && <Analytics />}
          
          {currentView === 'browse' && isAuthenticated && user && (
            <BrowseArticles userId={user.id} isAuthenticated={isAuthenticated} />
          )}
        </main>

        {currentUrl && quizGenerated && currentView === 'quiz' && (
          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-700 animate-fade-in px-4">
            <span className="inline-block bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm flex items-center gap-2">
              <span className="text-xl">📄</span>
              Quiz generated from: <span className="font-semibold text-green-600">{currentUrl}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

