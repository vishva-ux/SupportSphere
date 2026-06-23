import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash, 
  ArrowLeft, 
  HelpCircle, 
  Bookmark 
} from 'lucide-react';

interface Article {
  id: number;
  title: string;
  content: string;
  category_id: number;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  };
  created_by: {
    full_name: string;
  };
}

export const KnowledgeBase: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<string>('');

  const fetchArticles = async () => {
    try {
      let url = '/kb/articles';
      const params: string[] = [];
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
      if (selectedCategory) params.push(`category_id=${selectedCategory}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const res = await api.get(url);
      setArticles(res.data);
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

  useEffect(() => {
    fetchArticles();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editContent || !editCategory) return;
    try {
      await api.post('/kb/articles', {
        title: editTitle,
        content: editContent,
        category_id: parseInt(editCategory),
      });
      setIsCreating(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeArticle || !editTitle || !editContent || !editCategory) return;
    try {
      const res = await api.put(`/kb/articles/${activeArticle.id}`, {
        title: editTitle,
        content: editContent,
        category_id: parseInt(editCategory),
      });
      setActiveArticle(res.data);
      setIsEditing(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Delete this knowledge article?')) return;
    try {
      await api.delete(`/kb/articles/${id}`);
      setActiveArticle(null);
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEditTitle('');
    setEditContent('');
    setEditCategory('');
  };

  const startCreate = () => {
    resetForm();
    if (categories.length > 0) {
      setEditCategory(categories[0].id.toString());
    }
    setIsCreating(true);
  };

  const startEdit = () => {
    if (!activeArticle) return;
    setEditTitle(activeArticle.title);
    setEditContent(activeArticle.content);
    setEditCategory(activeArticle.category_id.toString());
    setIsEditing(true);
  };

  const isStaff = user?.role === 'Support Engineer' || user?.role === 'Administrator';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Search Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="relative w-full max-w-lg">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search solutions, articles, errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {isStaff && (
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </button>
        )}
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left List Pane */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Filter by Topic</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedCategory === null 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All Topics
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                    selectedCategory === c.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {articles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching articles found.
              </div>
            ) : (
              articles.map(art => (
                <button
                  key={art.id}
                  onClick={() => {
                    setActiveArticle(art);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start gap-3 ${
                    activeArticle?.id === art.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <BookOpen className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{art.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{art.category.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Reader/Editor Pane */}
        <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-8">
          
          {isCreating || isEditing ? (
            /* Creation / Modification Form */
            <form onSubmit={isCreating ? handleCreateArticle : handleEditArticle} className="max-w-2xl space-y-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {isCreating ? 'Write New Knowledge Article' : 'Edit Knowledge Article'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Article Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Setting up custom corporate mail rules"
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Category / Tag</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Article Content (Supports standard markdown)</label>
                  <textarea
                    required
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Provide details, step-by-step troubleshooting, error codes, and screenshots..."
                    className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    rows={12}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Save Article
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : activeArticle ? (
            /* Article Reader Panel */
            <div className="max-w-3xl space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{activeArticle.title}</h2>
                  <div className="flex flex-wrap gap-2 items-center text-xs text-slate-400 mt-2">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-semibold uppercase text-[10px]">
                      {activeArticle.category.name}
                    </span>
                    <span>•</span>
                    <span>Authored by {activeArticle.created_by.full_name}</span>
                    <span>•</span>
                    <span>Last updated {new Date(activeArticle.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {isStaff && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={startEdit}
                      className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteArticle(activeArticle.id)}
                      className="p-2 border border-red-200/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Render article content */}
              <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line border border-slate-150 dark:border-slate-800 p-6 rounded-2xl shadow-sm bg-slate-50/20 dark:bg-slate-800/10">
                {activeArticle.content}
              </div>
            </div>
          ) : (
            /* Empty Reader placeholder */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-100 dark:border-blue-900/30">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Support Knowledge Directory</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                Select an article from the sidebar directory, or use the search field to find help immediately.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
