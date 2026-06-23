import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Laptop, 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  Cpu, 
  Info,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface User {
  id: number;
  full_name: string;
  email: string;
}

interface Asset {
  id: number;
  asset_tag: string;
  hostname: string;
  operating_system: string;
  ip_address: string;
  ram: string;
  storage: string;
  cpu: string;
  warranty_expiry: string;
  status: string;
  employee?: User | null;
}

export const AssetManager: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form states
  const [tag, setTag] = useState('');
  const [host, setHost] = useState('');
  const [os, setOs] = useState('Windows 11 Enterprise');
  const [ip, setIp] = useState('');
  const [ram, setRam] = useState('16 GB');
  const [storage, setStorage] = useState('512 GB SSD');
  const [cpu, setCpu] = useState('Intel Core i7');
  const [warranty, setWarranty] = useState('');
  const [statusVal, setStatusVal] = useState('Active');
  const [employeeId, setEmployeeId] = useState('');

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users');
      // Filter out only employees or engineers
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  const openCreate = () => {
    setEditingAsset(null);
    setTag('');
    setHost('');
    setOs('Windows 11 Enterprise');
    setIp('');
    setRam('16 GB');
    setStorage('512 GB SSD');
    setCpu('Intel Core i7');
    setWarranty(new Date().toISOString().substring(0, 10));
    setStatusVal('Active');
    setEmployeeId('');
    setIsEditorOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setTag(asset.asset_tag);
    setHost(asset.hostname);
    setOs(asset.operating_system);
    setIp(asset.ip_address);
    setRam(asset.ram);
    setStorage(asset.storage);
    setCpu(asset.cpu);
    setWarranty(new Date(asset.warranty_expiry).toISOString().substring(0, 10));
    setStatusVal(asset.status);
    setEmployeeId(asset.employee?.id?.toString() || '');
    setIsEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      asset_tag: tag,
      hostname: host,
      operating_system: os,
      ip_address: ip,
      ram,
      storage,
      cpu,
      warranty_expiry: new Date(warranty).toISOString(),
      status: statusVal,
      employee_id: employeeId ? parseInt(employeeId) : null,
    };

    try {
      if (editingAsset) {
        // Edit/Update
        await api.put(`/assets/${editingAsset.id}`, payload);
      } else {
        // Create
        await api.post('/assets', payload);
      }
      setIsEditorOpen(false);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset from corporate registry?')) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.employee && a.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isAdmin = user?.role === 'Administrator';

  return (
    <div className="p-6 space-y-6">
      
      {/* Search and CRUD controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search tags, hostnames, assigned users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow hover:shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Grid of Corporate Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            No assets registered matching this description.
          </div>
        ) : (
          filteredAssets.map(asset => (
            <div 
              key={asset.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      asset.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                        : asset.status === 'In Repair'
                        ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                        : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                    }`}>
                      {asset.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{asset.hostname}</h4>
                  <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5">{asset.asset_tag}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs mt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">OS Platform</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.operating_system}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.ip_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware specs</span>
                    <span className="font-semibold text-slate-750 dark:text-slate-300">{asset.cpu} • {asset.ram} • {asset.storage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Owner User</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{asset.employee ? asset.employee.full_name : 'Unassigned pool'}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t border-slate-150 dark:border-slate-800/80 mt-4 shrink-0">
                  <button
                    onClick={() => openEdit(asset)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-xs transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="py-1.5 px-3 bg-red-950/20 hover:bg-red-900/20 text-red-500 border border-red-900/10 rounded font-semibold text-xs transition"
                    title="Decommission/Delete"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Editor Modal for CRUD */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Laptop className="h-5 w-5 text-blue-500" />
                <span>{editingAsset ? 'Modify Registered Asset' : 'Register New Hardware Asset'}</span>
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Asset Tag (ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-00003"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Hostname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JSMITH-LAPTOP"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Operating System</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. macOS Sequoia"
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">IP Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.10.88"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">CPU Type</label>
                  <input
                    type="text"
                    required
                    value={cpu}
                    onChange={(e) => setCpu(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">RAM</label>
                  <input
                    type="text"
                    required
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Storage</label>
                  <input
                    type="text"
                    required
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Warranty Expiration</label>
                  <input
                    type="date"
                    required
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Status</label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="In Repair">In Repair</option>
                    <option value="Decommissioned">Decommissioned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Assigned Employee</label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white"
                >
                  <option value="">Unassigned Pool</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Save Asset Spec
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
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
