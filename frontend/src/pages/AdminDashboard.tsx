import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { TicketDetails } from './TicketDetails';
import { KnowledgeBase } from './KnowledgeBase';
import { AssetManager } from './AssetManager';
import { SlaBadge } from '../components/SlaBadge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Plus, 
  Users, 
  FolderPlus, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Activity,
  X
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  department?: { name: string } | null;
}

interface Ticket {
  id: number;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  sla_due_at: string;
  category: { name: string };
  created_by: { full_name: string };
  assigned_to?: { full_name: string } | null;
}

interface Analytics {
  open_tickets: number;
  closed_tickets: number;
  avg_resolution_time_hrs: number;
  sla_violations: number;
  top_categories: { category: string; count: number }[];
  ticket_trends: { date: string; open_count: number; closed_count: number }[];
  engineer_performance: { name: string; resolved_count: number; avg_resolution_time_hrs: number }[];
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; sla_target_hours: number }[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  
  // Navigation
  const [currentTab, setCurrentTab] = useState('analytics');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form states
  const [userEmail, setUserEmail] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState('Employee');
  const [userDept, setUserDept] = useState('');
  const [userPass, setUserPass] = useState('');

  const [catName, setCatName] = useState('');
  const [catSla, setCatSla] = useState('8');

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/summary');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/users/departments/all');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/tickets/categories/all');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchDepartments();
    fetchCategories();
    fetchTickets();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        email: userEmail,
        full_name: userFullName,
        role: userRole,
        department_id: userDept ? parseInt(userDept) : null,
        password: userPass,
        is_active: true
      });
      setIsUserModalOpen(false);
      setUserEmail('');
      setUserFullName('');
      setUserPass('');
      fetchUsers();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tickets/categories/all', {
        name: catName,
        sla_target_hours: parseInt(catSla)
      });
      setIsCategoryModalOpen(false);
      setCatName('');
      fetchCategories();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      await api.put(`/users/${targetUser.id}`, {
        is_active: !targetUser.is_active
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={
          currentTab === 'analytics' ? 'Global Command Center Analytics' :
          currentTab === 'tickets' ? 'Enterprise Incidents Audit Log' :
          currentTab === 'users' ? 'Corporate Users Registry' :
          currentTab === 'assets' ? 'Hardware Spec Inventory' :
          currentTab === 'kb' ? 'Internal Document Library' : 'Platform System Settings'
        } />

        <main className="flex-1 overflow-y-auto">
          
          {currentTab === 'analytics' && analytics && (
            <div className="p-6 space-y-6">
              
              {/* Stat Widget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Tickets</span>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{analytics.open_tickets}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Resolved Tickets</span>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{analytics.closed_tickets}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Avg Resolution</span>
                    <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{analytics.avg_resolution_time_hrs}h</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">SLA Breaches</span>
                    <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{analytics.sla_violations}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>

              </div>

              {/* Chart Block */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Line chart for ticket volumes */}
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Ticket Ingestion Trends (7 Days)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.ticket_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="open_count" name="Opened" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="closed_count" name="Resolved" stroke="#10b981" strokeWidth={2.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar chart for Categories */}
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Incidents by Category Classification</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.top_categories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="count" name="Ticket Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Engineer Performance Table */}
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">Support Engineer SLAs & Performance Scorecard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-2.5 px-4">Engineer Name</th>
                        <th className="py-2.5 px-4">Tickets Resolved</th>
                        <th className="py-2.5 px-4">Average Resolution Time</th>
                        <th className="py-2.5 px-4 text-right">Performance Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {analytics.engineer_performance.map((eng, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{eng.name}</td>
                          <td className="py-3 px-4">{eng.resolved_count} Incidents</td>
                          <td className="py-3 px-4 font-medium text-slate-650">{eng.avg_resolution_time_hrs} hours</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eng.resolved_count > 5 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {eng.resolved_count > 5 ? 'Tier-1 Elite' : 'Standard'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {currentTab === 'tickets' && (
            <div className="p-6 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">SLA Deadline</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {tickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="py-3 px-4 font-semibold text-slate-500">INC-{t.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{t.title}</td>
                        <td className="py-3 px-4">{t.created_by.full_name}</td>
                        <td className="py-3 px-4 text-slate-500">{t.category.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded border bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 font-bold uppercase text-[9px]">
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <SlaBadge created_at={t.created_at} sla_due_at={t.sla_due_at} resolved_at={null} status={t.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded border bg-slate-50 text-slate-500 font-bold text-[9px] uppercase">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{t.assigned_to ? t.assigned_to.full_name : 'Unassigned'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedTicketId(t.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition"
                          >
                            Audit Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'users' && (
            <div className="p-6 space-y-6">
              
              <div className="flex justify-end">
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold transition hover:bg-blue-700 shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Onboard User</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Security Role</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-white">{u.full_name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{u.department ? u.department.name : 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded font-semibold text-xs transition"
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'assets' && <AssetManager />}
          {currentTab === 'kb' && <KnowledgeBase />}

          {currentTab === 'config' && (
            <div className="p-6 space-y-6 max-w-4xl">
              
              {/* Category Configurations */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <span>Manage Categories & SLA Policies</span>
                  </h3>
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="p-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/10 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white block mb-0.5">{cat.name}</span>
                        <span className="text-slate-400">Target Resolution Time limit</span>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30 rounded-lg font-bold">
                        {cat.sla_target_hours} Hours SLA
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nginx & System Configuration logs info */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-850 dark:text-white flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-indigo-500" />
                  <span>Docker Infrastructure Gateway Info</span>
                </h3>
                <div className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 space-y-2 border border-slate-800 overflow-x-auto">
                  <p className="text-slate-500"># Current reverse-proxy routing rules</p>
                  <p>upstream backend_app &#123; server backend:8000; &#125;</p>
                  <p>upstream frontend_app &#123; server frontend:3000; &#125;</p>
                  <p>server &#123; listen 80; location /api/ &#123; proxy_pass http://backend_app; &#125; location / &#123; proxy_pass http://frontend_app; &#125; &#125;</p>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Audit Drawer */}
      {selectedTicketId && (
        <TicketDetails 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          onUpdate={fetchTickets} 
        />
      )}

      {/* User Onboard Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Users className="h-5 w-5 text-blue-500" />
                <span>Onboard Corporate Account</span>
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-655">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Security Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Support Engineer">Support Engineer</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Department</label>
                  <select
                    value={userDept}
                    onChange={(e) => setUserDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  >
                    <option value="">No department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userPass}
                  onChange={(e) => setUserPass(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow">
                  Create User
                </button>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition">
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-800 dark:text-white">Add Ticket Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-655">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Category Classification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSO Login Issue"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">SLA Limit (Hours)</label>
                <input
                  type="number"
                  required
                  value={catSla}
                  onChange={(e) => setCatSla(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-850 dark:text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                  Create Category
                </button>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition">
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
