import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChefHat } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { setIsAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Default admin password (should be changed to environment variable in production)
  const ADMIN_PASSWORD = 'admin123';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      navigate('/admin-dashboard');
    } else {
      setError('Invalid password');
      setPassword('');
    }

    setIsLoading(false);
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-500/50 disabled:to-orange-600/50 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-xl shadow-orange-500/30"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-zinc-700/30 rounded-xl border border-zinc-600/50">
          <p className="text-zinc-400 text-xs text-center">
            <span className="font-semibold text-white">Demo Password: </span>
            admin123
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
