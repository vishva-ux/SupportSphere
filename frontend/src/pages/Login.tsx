import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Shield, Key, Mail, AlertCircle, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      await login(response.data.access_token);
      // AuthContext will handle state reload and profile fetching
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Network error. Unable to connect to support platform.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseMock = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

      <div className="max-w-md w-full space-y-8 glass p-8 rounded-2xl border border-slate-800 shadow-2xl z-10">
        <div>
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
            SupportSphere
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Enterprise Incident & Service Desk
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/20 border border-red-800/40 text-red-400 rounded-lg flex items-start gap-2.5 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Key className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/40 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm transition"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Roles Seed Info */}
        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Info className="h-4 w-4 text-blue-500" />
            <span>Developer Sandbox Quick Access:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleUseMock('employee@supportsphere.com', 'EmployeeSphere2026!')}
              className="px-2 py-1.5 bg-slate-800/40 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 rounded border border-slate-700/60 transition"
            >
              Employee
            </button>
            <button
              onClick={() => handleUseMock('engineer@supportsphere.com', 'EngineerSphere2026!')}
              className="px-2 py-1.5 bg-slate-800/40 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 rounded border border-slate-700/60 transition"
            >
              Engineer
            </button>
            <button
              onClick={() => handleUseMock('admin@supportsphere.com', 'AdminSphere2026!')}
              className="px-2 py-1.5 bg-slate-800/40 hover:bg-slate-800 text-[10px] font-semibold text-slate-300 rounded border border-slate-700/60 transition"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
