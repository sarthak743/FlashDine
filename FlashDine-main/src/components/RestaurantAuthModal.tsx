import { useState } from 'react';
import { Lock, Mail, KeyRound, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { manualLogin, initiateGoogleLogin, ApiError } from '@/utils/api';
import { restaurants } from '@/data/restaurants';

interface RestaurantAuthModalProps {
  onAuthSuccess: (restaurantId: string) => void;
  isOpen: boolean;
}


export function RestaurantAuthModal({ onAuthSuccess, isOpen }: RestaurantAuthModalProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState('default');
  
  // Manual login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const restaurantList = Object.values(restaurants);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await manualLogin(selectedRestaurant, email, password);
      setSuccessMessage('Login successful!');
      setTimeout(() => {
        onAuthSuccess(result.user.restaurantId);
      }, 500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const currentPath = window.location.hash.slice(1) || window.location.pathname || '/kitchen';
      const { redirectUrl } = await initiateGoogleLogin('login', 'campus-delights', currentPath);
      window.location.href = redirectUrl;
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Google login failed.');
      } else {
        setError('Google login failed. Please try again.');
      }
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700/50 shadow-2xl overflow-hidden animate-in fade-in scale-95">
        {/* Header */}
        <div className="relative px-6 py-8 bg-gradient-to-r from-orange-600 to-orange-500">
          <h2 className="text-2xl font-bold text-white mb-1">Admin Access</h2>
          <p className="text-orange-100 text-sm">Authenticate for your restaurant</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Restaurant Selection */}
          <div>
            <label className="block text-white font-semibold mb-3 text-sm">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-400" />
                Select Your Restaurant
              </div>
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              disabled={isLoading}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {restaurantList.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleManualLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-400" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurant.com"
                  disabled={isLoading}
                  className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-400" />
                    Password
                  </div>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>

              {/* Login Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-500/50 disabled:to-orange-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-xl shadow-orange-500/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Logging in…
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Login
                    </>
                  )}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-zinc-600"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-400 text-sm">or</span>
                  <div className="flex-grow border-t border-zinc-600"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  Continue with Google
                </button>
              </div>
          </form>

          {/* Demo Info */}
          <div className="p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/30">
            <p className="text-zinc-400 text-xs text-center">
              <span className="font-semibold text-white">Demo Credentials:</span>
              <br />
              Use email: <span className="font-mono text-orange-400">admin@restaurant.com</span>
              <br />
              Password: <span className="font-mono text-orange-400">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
