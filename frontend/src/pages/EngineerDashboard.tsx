import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { SlaBadge } from '../components/SlaBadge';
import { TicketDetails } from './TicketDetails';
import { KnowledgeBase } from './KnowledgeBase';
import { AssetManager } from './AssetManager';
import { 
  Inbox, 
  Search, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  Play,
  ClipboardList
} from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  sla_due_at: string;
  resolved_at?: string | null;
  category: { name: string };
  created_by: { full_name: string };
  assigned_to?: { id: number; full_name: string } | null;
}

export const EngineerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState('tickets');
  
  // Queue sub-filters
  const [queueFilter, setQueueFilter] = useState<'my' | 'unassigned' | 'all'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleClaimTicket = async (ticketId: number) => {
    if (!user) return;
    try {
      await api.put(`/tickets/${ticketId}`, {
        assigned_to_id: user.id,
        status: 'Assigned'
      });
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter(t => {
    // 1. Queue filter
    if (queueFilter === 'my') {
      if (t.assigned_to?.id !== user?.id) return false;
    } else if (queueFilter === 'unassigned') {
      if (t.assigned_to) return false;
    }
    
    // 2. Search query filter
    return (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.created_by.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toString() === searchQuery
    );
  });

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
      
      {/* Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={
          currentTab === 'tickets' ? 'Support Desk Incident Queues' :
          currentTab === 'kb' ? 'Help & Knowledge Directory' : 'Asset Inventory & Specs'
        } />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'tickets' && (
            <div className="p-6 space-y-6">
              
              {/* Queue Filters and Search */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Queue segment selectors */}
                <div className="flex bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
                  <button
                    onClick={() => setQueueFilter('my')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                      queueFilter === 'my' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    My Assigned Queue
                  </button>
                  <button
                    onClick={() => setQueueFilter('unassigned')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                      queueFilter === 'unassigned' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Unassigned Incidents
                  </button>
                  <button
                    onClick={() => setQueueFilter('all')}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition ${
                      queueFilter === 'all' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    All Active Queues
                  </button>
                </div>

                {/* Search field */}
                <div className="relative w-full max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search titles, employees, category, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Incidents table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Ticket ID</th>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Reporter</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">SLA Countdown</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Assignee</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs">
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <span>No incidents match this query.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredTickets.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition">
                            <td className="py-3.5 px-4 font-semibold text-slate-500">INC-{t.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">{t.title}</td>
                            <td className="py-3.5 px-4">{t.created_by.full_name}</td>
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
                                resolved_at={t.resolved_at} 
                                status={t.status} 
                              />
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusStyle(t.status)}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-500">
                              {t.assigned_to ? t.assigned_to.full_name : 'Unassigned'}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1">
                              {!t.assigned_to && (
                                <button
                                  onClick={() => handleClaimTicket(t.id)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded transition"
                                >
                                  Claim
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedTicketId(t.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition"
                              >
                                Manage
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

          {currentTab === 'assets' && <AssetManager />}
        </main>
      </div>

      {/* Details drawer overlay */}
      {selectedTicketId && (
        <TicketDetails 
          ticketId={selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          onUpdate={fetchTickets} 
        />
      )}

    </div>
  );
};
