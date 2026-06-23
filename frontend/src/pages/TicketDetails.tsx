import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SlaBadge } from '../components/SlaBadge';
import { 
  X, 
  MessageSquare, 
  Paperclip, 
  User, 
  Calendar, 
  AlertTriangle, 
  Plus, 
  Check, 
  Eye, 
  Lock,
  Cpu
} from 'lucide-react';

interface Comment {
  id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  author: {
    full_name: string;
    role: string;
  };
}

interface Attachment {
  id: number;
  file_name: string;
  file_path: string;
  created_at: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  sla_due_at: string;
  resolved_at?: string | null;
  created_by: {
    id: number;
    full_name: string;
    email: string;
  };
  assigned_to?: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  category: {
    id: number;
    name: string;
  };
  asset?: {
    id: number;
    asset_tag: string;
    hostname: string;
    operating_system: string;
    ip_address: string;
    ram: string;
    storage: string;
    cpu: string;
    status: string;
  } | null;
}

interface TicketDetailsProps {
  ticketId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [engineers, setEngineers] = useState<{ id: number; full_name: string }[]>([]);
  
  // Form updates
  const [statusVal, setStatusVal] = useState('');
  const [priorityVal, setPriorityVal] = useState('');
  const [assignedToVal, setAssignedToVal] = useState<string>('');
  
  // File upload state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const ticketRes = await api.get(`/tickets/${ticketId}`);
      setTicket(ticketRes.data);
      setStatusVal(ticketRes.data.status);
      setPriorityVal(ticketRes.data.priority);
      setAssignedToVal(ticketRes.data.assigned_to_id?.toString() || '');
      
      const commentsRes = await api.get(`/tickets/${ticketId}/comments`);
      setComments(commentsRes.data);

      const attachRes = await api.get(`/tickets/${ticketId}/attachments`);
      setAttachments(attachRes.data);
    } catch (err) {
      console.error('Error fetching ticket details', err);
    }
  };

  const fetchEngineers = async () => {
    if (user?.role !== 'Employee') {
      try {
        const res = await api.get('/users/engineers');
        setEngineers(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    fetchEngineers();
  }, [ticketId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/tickets/${ticketId}/comments`, {
        content: newComment,
        is_internal: isInternalComment
      });
      setNewComment('');
      setIsInternalComment(false);
      fetchTicketDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      await api.post(`/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFileToUpload(null);
      fetchTicketDetails();
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProperties = async () => {
    try {
      await api.put(`/tickets/${ticketId}`, {
        status: statusVal,
        priority: priorityVal,
        assigned_to_id: assignedToVal ? parseInt(assignedToVal) : null,
      });
      fetchTicketDetails();
      onUpdate();
    } catch (err) {
      console.error('Properties update failed', err);
    }
  };

  if (!ticket) return null;

  const isStaff = user?.role === 'Support Engineer' || user?.role === 'Administrator';

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl transition-all duration-200 border-l border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500 dark:text-slate-400">INC-{ticket.id}</span>
            <SlaBadge 
              created_at={ticket.created_at} 
              sla_due_at={ticket.sla_due_at} 
              resolved_at={ticket.resolved_at} 
              status={ticket.status} 
            />
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body Container */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          
          {/* Main Details and Comments Block */}
          <div className="flex-1 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{ticket.title}</h2>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed white-space-pre-line">
                {ticket.description}
              </div>
            </div>

            {/* Asset integration display */}
            {ticket.asset && (
              <div className="p-4 bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  <Cpu className="h-4 w-4" />
                  <span>Linked Corporate Asset Details</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Asset Tag</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.asset.asset_tag}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hostname</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.asset.hostname}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Operating System</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.asset.operating_system}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IP Address</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.asset.ip_address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hardware Spec</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.asset.cpu} / {ticket.asset.ram} / {ticket.asset.storage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 uppercase">{ticket.asset.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span>Attachments ({attachments.length})</span>
              </h3>
              
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map(att => (
                    <div 
                      key={att.id}
                      className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/20"
                    >
                      <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300" title={att.file_name}>
                        {att.file_name}
                      </span>
                      <button 
                        onClick={() => window.open(`/api/uploads/${att.file_path.split('/').pop()}`)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload form */}
              <form onSubmit={handleUploadAttachment} className="flex gap-2 items-center">
                <input 
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-400 hover:file:bg-blue-100 transition"
                />
                {fileToUpload && (
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0 transition"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </form>
            </div>

            {/* Conversation/Comments Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <span>Discussion Logs</span>
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No comments found.</p>
                ) : (
                  comments.map(c => (
                    <div 
                      key={c.id} 
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        c.is_internal 
                          ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30' 
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {c.author.full_name} ({c.author.role})
                        </span>
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{c.content}</p>
                      {c.is_internal && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Internal Notes (Staff Only)</span>
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type updates or feedback..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent transition"
                  rows={2}
                />
                <div className="flex justify-between items-center">
                  {isStaff ? (
                    <label className="flex items-center gap-1.5 text-xs text-slate-500 select-none cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        <span>Internal Staff note</span>
                      </span>
                    </label>
                  ) : <div />}

                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
                  >
                    Comment
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Properties Management Sidebar (Right panel) */}
          <div className="w-full lg:w-72 p-6 bg-slate-50 dark:bg-slate-800/10 space-y-5 flex flex-col justify-between shrink-0">
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Incident Metadata</h3>
              
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Status</span>
                  {isStaff ? (
                    <select 
                      value={statusVal} 
                      onChange={(e) => setStatusVal(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Open">Open</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{ticket.status}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Priority</span>
                  {isStaff ? (
                    <select 
                      value={priorityVal} 
                      onChange={(e) => setPriorityVal(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="P1 Critical">P1 Critical</option>
                      <option value="P2 High">P2 High</option>
                      <option value="P3 Medium">P3 Medium</option>
                      <option value="P4 Low">P4 Low</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{ticket.priority}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Ticket Category</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{ticket.category.name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Reporter</span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{ticket.created_by.full_name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Assignee</span>
                  {isStaff ? (
                    <select 
                      value={assignedToVal} 
                      onChange={(e) => setAssignedToVal(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {engineers.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                      {ticket.assigned_to ? ticket.assigned_to.full_name : 'Unassigned'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Created At</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA warnings and modification triggers */}
            <div>
              {isStaff ? (
                <button
                  onClick={handleSaveProperties}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Properties</span>
                </button>
              ) : (
                ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                  <button
                    onClick={async () => {
                      await api.put(`/tickets/${ticketId}`, { status: 'Resolved' });
                      fetchTicketDetails();
                      onUpdate();
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Resolve Incident
                  </button>
                )
              )}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
};
