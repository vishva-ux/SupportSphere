import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SlaBadge } from '../components/SlaBadge';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { TicketDetails } from './TicketDetails';
import { KnowledgeBase } from './KnowledgeBase';
import { 
  PlusCircle, 
  Search, 
  Laptop, 
  AlertCircle, 
  ChevronRight, 
  Inbox, 
  Calendar,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface Asset {
  id: number;
  asset_tag: string;
  hostname: string;
  operating_system: string;
  ip_address: string;
  status: string;
}

interface Ticket {
  id: number;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  sla_due_at: string;
  category: { name: string };
  assigned_to?: { full_name: string } | null;
}

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  
  // Tab control
  const [currentTab, setCurrentTab] = useState('tickets');

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket creation form modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('P3 Medium');
  const [newCategory, setNewCategory] = useState('');
  const [newAsset, setNewAsset] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/tickets/categories/all');
      setCategories(res.data);
      if (res.data.length > 0) {
        setNewCategory(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAssets();
    fetchCategories();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newCategory) return;
    try {
      await api.post('/tickets', {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        category_id: parseInt(newCategory),
        asset_id: newAsset ? parseInt(newAsset) : null,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('P3 Medium');
      setNewAsset('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'P1 Critical': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-900/30';
      case 'P2 High': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-900/30';
      case 'P3 Medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700/60';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30';
      case 'Assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/30';
      case 'Resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30';
      default: return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/60';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Dynamic Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        openCreateModal={() => setIsCreateOpen(true)} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={
          currentTab === 'tickets' ? 'My Support Incidents' :
          currentTab === 'kb' ? 'Help & Knowledge Directory' : 'My Registered IT Assets'
        } />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'tickets' && (
            <div className="p-6 space-y-6">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search incidents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow hover:shadow-blue-500/10 transition"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>Raise Ticket</span>
                </button>
              </div>

              {/* Tickets Table Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Ticket ID</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Topic</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">SLA Deadline</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Assignee</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <span>No reported incidents found.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                            <td className="py-3.5 px-4 font-semibold text-slate-500">INC-{t.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">{t.title}</td>
                            <td className="py-3.5 px-4 text-slate-500">{t.category.name}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${getPriorityStyle(t.priority)}`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <SlaBadge 
                                created_at={t.created_at} 
                                sla_due_at={t.sla_due_at} 
                                resolved_at={null} 
                                status={t.status} 
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusStyle(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">{t.assigned_to ? t.assigned_to.full_name : 'Unassigned'}</td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedTicketId(t.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {currentTab === 'kb' && <KnowledgeBase />}

          {currentTab === 'assets' && (
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.length === 0 ? (
                  <div className="col-span-full py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                    <Laptop className="h-10 w-10 mx-auto mb-2 opacity-40 text-blue-500" />
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Registered Assets</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Currently you do not have any corporate assets assigned to your profile. Please contact IT support if this is incorrect.
                    </p>
                  </div>
                ) : (
                  assets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                          <Laptop className="h-5 w-5" />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">
                          {asset.status}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{asset.hostname}</h4>
                        <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5">{asset.asset_tag}</p>
                      </div>

                      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Operating System</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.operating_system}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IP Address</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Ticket Details Drawer */}
      {selectedTicketId && (
        <TicketDetails 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          onUpdate={fetchTickets} 
        />
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                <span>Submit IT Support Request</span>
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Brief Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Wi-Fi dropping connection on 3rd floor"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Issue Description</label>
                <textarea 
                  required
                  placeholder="Provide any error messages, how to reproduce it, or specific hardware details..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Category</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Priority</label>
                  <select 
                    value={newPriority} 
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  >
                    <option value="P1 Critical">P1 Critical (SLA: 2h)</option>
                    <option value="P2 High">P2 High (SLA: 6h)</option>
                    <option value="P3 Medium">P3 Medium (SLA: 12h)</option>
                    <option value="P4 Low">P4 Low (SLA: 24h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Link Hardware Asset (Optional)</label>
                <select 
                  value={newAsset} 
                  onChange={(e) => setNewAsset(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  <option value="">No hardware associated</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.hostname} ({a.asset_tag})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-blue-500/10"
                >
                  Submit Incident
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition"
                >
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

// Re-declare local Close icon since X is imported from lucide-react but sometimes lacks styling
const X: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
