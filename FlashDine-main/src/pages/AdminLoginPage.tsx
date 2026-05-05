import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ChefHat, Loader2, Mail, KeyRound } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { manualLogin, initiateGoogleLogin, verifySession } from '@/utils/api';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setIsAdmin, setRestaurantId } = useStore();
  const [restaurantIdInput, setRestaurantIdInput] = useState('default');
  const [email, setEmail] = useState('admin@campus-delights.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleAttemptedEmail, setGoogleAttemptedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const result = await verifySession();
        if (result.authenticated && result.user?.restaurantId) {
          setRestaurantId(result.user.restaurantId);
          setIsAdmin(true);
          navigate('/kitchen', { replace: true });
          return;
        }
      } catch {
        // No active session; keep user on login form.
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [navigate, setIsAdmin, setRestaurantId]);

  // Check for Google auth errors from callback redirect
  useEffect(() => {
    const errorFromUrl = searchParams.get('error');
    const emailFromUrl = searchParams.get('attempted_email');
    
    if (errorFromUrl) {
      setError(errorFromUrl);
      if (emailFromUrl) {
        setGoogleAttemptedEmail(emailFromUrl);
      }
      // Clear the error from URL after displaying
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-zinc-400 mt-3">Checking your admin session...</p>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await manualLogin(restaurantIdInput, email, password);
      setRestaurantId(result.user.restaurantId);
      setIsAdmin(true);
      navigate('/kitchen');
    } catch {
      setError('Invalid credentials. Please check restaurant ID, email, and password.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const currentPath = window.location.hash.slice(1) || window.location.pathname;
      const redirectPath = currentPath.includes('/admin-login') ? '/kitchen' : (currentPath || '/kitchen');
      const { redirectUrl } = await initiateGoogleLogin(restaurantIdInput, redirectPath);
      window.location.href = redirectUrl;
    } catch {
      setError('Google login failed. Please try again.');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/30">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Flash<span className="text-orange-500">Dine</span>
        </h1>
        <p className="text-zinc-400">Admin Login</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-zinc-800/50 rounded-2xl border border-zinc-700/50 p-8">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Restaurant ID */}
          <div>
            <label className="block text-white font-semibold mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-400" />
                Restaurant ID
              </div>
            </label>
            <input
              type="text"
              value={restaurantIdInput}
              onChange={(e) => setRestaurantIdInput(e.target.value)}
              placeholder="default"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-white font-semibold mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-400" />
                Admin Email
              </div>
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@campus-delights.com"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-white font-semibold mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-400" />
                Admin Password
              </div>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              {googleAttemptedEmail && (
                <p className="text-red-300 text-xs mt-2">
                  <span className="font-mono">{googleAttemptedEmail}</span> is not authorized as an admin.
                </p>
              )}
            </div>
          )}

          {/* Login + Register Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={isLoading || !restaurantIdInput || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-500/50 disabled:to-orange-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-xl shadow-orange-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>

          <div className="flex justify-center w-full mt-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
            >
              Continue with Google
            </button>
          </div>
        </form>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
          <p className="text-zinc-400 text-xs text-center leading-relaxed">
            <span className="font-semibold text-white">Demo login:</span>
            <br />Restaurant: <span className="text-orange-400 font-mono">default</span>
            <br />Email: <span className="text-orange-400 font-mono">admin@campus-delights.com</span>
            <br />Password: <span className="text-orange-400 font-mono">admin123</span>
          </p>
        </div>
      </div>

      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
        className="mt-8 text-zinc-400 hover:text-white transition-colors text-sm"
      >
        Back to Home
      </button>
    </div>
  );
}
