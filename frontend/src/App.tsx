import React from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EngineerDashboard } from './pages/EngineerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Shield } from 'lucide-react';

export const App: React.FC = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Shield className="h-12 w-12 text-blue-500 animate-pulse mb-4" />
        <p className="text-sm font-semibold tracking-wider uppercase text-slate-400">
          Loading Security Profiles...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  // Route to the appropriate dashboard based on user role
  switch (user.role) {
    case 'Administrator':
      return <AdminDashboard />;
    case 'Support Engineer':
      return <EngineerDashboard />;
    case 'Employee':
    default:
      return <EmployeeDashboard />;
  }
};

export default App;
