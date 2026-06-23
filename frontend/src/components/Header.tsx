import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import { User, Activity } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          <span>System Online</span>
        </div>

        {/* Alerts & Notifications */}
        <NotificationCenter />

        {/* Separator */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User badge */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{user.full_name}</p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight font-medium uppercase tracking-wider">{user.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
