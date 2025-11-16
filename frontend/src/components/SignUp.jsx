import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export default function SignUp({ onAuthSuccess, onSwitchToSignIn, onSkipAuth }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await api.register(
        formData.email,
        formData.username,
        formData.password
      );
      
      if (result.success) {
        // Store user data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('userId', result.user.id.toString());
        
        onAuthSuccess(result.user);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-green-50 via-yellow-50 to-lime-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-6"
          >
            <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full flex items-center justify-center text-7xl shadow-2xl">
              🧠
            </div>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 bg-clip-text text-transparent mb-3">
            Join the Fight
          </h1>
          <p className="text-gray-600 text-base sm:text-lg flex items-center justify-center gap-2">
            <span className="text-2xl">🛡️</span>
            Create an account to combat misinformation
          </p>
        </div>

        {/* Sign Up Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-2xl">📧</span>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-base"
                placeholder="your@email.com"
              />
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-base"
                placeholder="Choose a username"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-base"
                placeholder="Min. 6 characters"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300 text-base"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-3xl">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 via-lime-600 to-yellow-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">✨</span>
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Already have an account?
            </p>
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3.5 rounded-xl font-semibold text-base hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🚀</span>
              <span>Sign In Instead</span>
            </button>
          </div>

          {/* Guest Mode Button */}
          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onSkipAuth}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold text-base hover:from-gray-200 hover:to-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">🔓</span>
              <span>Continue as Guest</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Guest mode: Take quizzes without saving results
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6 flex items-center justify-center gap-2">
          <span className="text-xl">❤️</span>
          Built for fighting misinformation together
        </p>
      </motion.div>
    </div>
  );
}
