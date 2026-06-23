import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, 
  Ticket, 
  BookOpen, 
  Laptop, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  PlusCircle
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCreateModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, openCreateModal }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const employeeLinks = [
    { id: 'tickets', label: 'My Tickets', icon: Ticket },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'assets', label: 'My Assets', icon: Laptop },
  ];

  const engineerLinks = [
    { id: 'tickets', label: 'Assigned Tickets', icon: Ticket },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'assets', label: 'Asset Inventory', icon: Laptop },
  ];

  const adminLinks = [
    { id: 'analytics', label: 'System Analytics', icon: BarChart2 },
    { id: 'tickets', label: 'All Incidents', icon: Ticket },
    { id: 'users', label: 'Manage Users', icon: Users },
    { id: 'assets', label: 'Asset Inventory', icon: Laptop },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'config', label: 'Configurations', icon: Settings },
  ];

  const getLinks = () => {
    if (user.role === 'Administrator') return adminLinks;
    if (user.role === 'Support Engineer') return engineerLinks;
    return employeeLinks;
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 h-screen sticky top-0">
      <div className="flex flex-col flex-1">
        {/* Brand logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
          <Shield className="h-7 w-7 text-blue-500 fill-blue-500/20" />
          <span className="font-semibold text-lg text-white tracking-wide">SupportSphere</span>
        </div>

        {/* User context card */}
        <div className="p-4 mx-3 my-4 bg-slate-800/50 rounded-lg border border-slate-800">
          <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-900/60 text-blue-300 rounded border border-blue-800">
            {user.role}
          </span>
        </div>

        {/* Action Button for Employees */}
        {user.role === 'Employee' && openCreateModal && (
          <button 
            onClick={openCreateModal}
            className="mx-3 mb-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-blue-500/10 transition duration-150"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>New Ticket</span>
          </button>
        )}

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1">
          {getLinks().map((link) => {
            const Icon = link.icon;
            const active = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentTab(link.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-sm transition duration-150"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4.5 w-4.5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4.5 w-4.5 text-blue-400" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-950/20 hover:text-red-400 text-slate-400 font-medium text-sm transition duration-150"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
