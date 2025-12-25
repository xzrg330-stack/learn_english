
import React, { useState, useEffect, useCallback } from 'react';
import { Article } from './types';
import { ReaderNavbar, AdminNavbar } from './components/Navbar';
import ArticleCard from './components/ArticleCard';
import ArticleEditor from './components/ArticleEditor';
import ArticleReader from './components/ArticleReader';
import { articleService } from './services/articleService';

const PasscodeModal: React.FC<{ onConfirm: (pass: string) => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(input);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-slate-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">进入后台管理</h3>
        <p className="text-slate-500 text-sm mb-6">请输入管理员口令以继续</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="管理员口令"
            className={`w-full px-5 py-3 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold transition-all`}
          />
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-bold text-sm">取消</button>
            <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all">确认</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'reader' | 'admin'>('reader');
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin') {
      if (!isAuthenticated) {
        setShowPasscodeModal(true);
      } else {
        setCurrentView('admin');
      }
    }
  }, [isAuthenticated]);

  const navigateTo = (view: 'reader' | 'admin') => {
    if (view === 'admin' && !isAuthenticated) {
      setShowPasscodeModal(true);
      return;
    }
    setCurrentView(view);
    const url = new URL(window.location.href);
    if (view === 'admin') {
      url.searchParams.set('view', 'admin');
    } else {
      url.searchParams.delete('view');
    }
    window.history.pushState({}, '', url);
  };

  const handlePasscodeConfirm = async (pass: string) => {
    const correctPass = await articleService.getPasscode();
    if (pass === correctPass) {
      setIsAuthenticated(true);
      setShowPasscodeModal(false);
      setCurrentView('admin');
    } else {
      alert("口令错误，请重试");
    }
  };

  return (
    <>
      {showPasscodeModal && (
        <PasscodeModal 
          onConfirm={handlePasscodeConfirm} 
          onCancel={() => setShowPasscodeModal(false)} 
        />
      )}
      {currentView === 'admin' && isAuthenticated
        ? <AdminApp onNavigate={navigateTo} /> 
        : <ReaderApp onNavigate={navigateTo} />}
    </>
  );
};

interface AppProps {
  onNavigate: (view: 'reader' | 'admin') => void;
}

export const ReaderApp: React.FC<AppProps> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await articleService.fetchArticles();
      setArticles(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const handleSelectArticle = async (id: string) => {
    setSelectedArticleId(id);
    try {
      await articleService.incrementViewCount(id);
      setArticles(prev => prev.map(a => a.id === id ? { ...a, viewCount: a.viewCount + 1 } : a));
    } catch (err) {}
  };

  const selectedArticle = articles.find(a => a.id === selectedArticleId);
  const publishedArticles = articles.filter(a => a.isPublished);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ReaderNavbar />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <ArticleReader article={selectedArticle} onBack={() => setSelectedArticleId(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ReaderNavbar />
      
      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow">
         <div className="mb-5">
          <p className="text-slate-500 font-medium">AI动画辅助，让英语学习更直观有趣。</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : publishedArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-400">暂无课程内容</h3>
            <p className="text-slate-400 mt-1">管理员正在快马加鞭上传中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedArticles.map(article => (
              <ArticleCard key={article.id} article={article} onClick={() => handleSelectArticle(article.id)} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm font-medium border-t border-slate-200 mt-10">
        <div className="mb-4">© 2025 星际光年科技有限公司</div>
        <button 
          onClick={() => onNavigate('admin')}
          className="hidden lg:inline-block text-xs text-transparent hover:text-blue-600 font-semibold transition-colors"
        >
          后台管理
        </button>
      </footer>
    </div>
  );
};

export const AdminApp: React.FC<AppProps> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await articleService.fetchArticles();
      setArticles(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  const handleSaveArticle = async (data: Omit<Article, 'id' | 'createdAt' | 'viewCount' | 'isPublished'>) => {
    setIsLoading(true);
    try {
      const articleToSave: Omit<Article, 'viewCount' | 'createdAt'> = {
        ...data,
        id: editingArticleId || Math.random().toString(36).substr(2, 9),
        isPublished: true
      };
      await articleService.saveArticle(articleToSave);
      await loadArticles();
      setShowEditor(false);
      setEditingArticleId(null);
    } catch (err) {
      alert("保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("确定要删除此文章吗？")) return;
    setIsLoading(true);
    try {
      await articleService.deleteArticle(id);
      await loadArticles();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePasscode = async () => {
    if (!newPasscode.trim()) return;
    try {
      await articleService.setPasscode(newPasscode.trim());
      alert("口令更新成功");
      setNewPasscode('');
      setShowSettings(false);
    } catch (err) {
      alert("更新失败");
    }
  };

  const editingArticle = articles.find(a => a.id === editingArticleId);

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminNavbar onBackClick={() => onNavigate('reader')} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        {showEditor ? (
          <div>
            <button 
              onClick={() => { setShowEditor(false); setEditingArticleId(null); }} 
              className="mb-6 flex items-center gap-2 text-blue-600 font-bold text-sm"
            >
              ← 返回文章列表
            </button>
            <ArticleEditor onSave={handleSaveArticle} initialArticle={editingArticle} />
          </div>
        ) : (
          <div className="space-y-6">
            <header className="flex justify-between items-center mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-800">课程库管理</h2>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">RDS Online</span>
                  </div>
                </div>
                <p className="text-slate-500 text-sm">已连接阿里云 RDS: learn_english</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSettings(!showSettings)} 
                  className="bg-white hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-xl font-bold text-sm border border-slate-200 shadow-sm transition-all"
                >
                  后台设置
                </button>
                <button onClick={() => { setEditingArticleId(null); setShowEditor(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                  发布新课件
                </button>
              </div>
            </header>

            {showSettings && (
              <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50/50 mb-10 animate-in slide-in-from-top-4 duration-300">
                <h3 className="text-lg font-bold text-slate-800 mb-2">安全设置</h3>
                <p className="text-slate-400 text-xs mb-6 font-medium">更新进入后台管理所需的口令</p>
                <div className="flex gap-4 max-w-md">
                   <input 
                    type="password" 
                    placeholder="新管理员口令" 
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold"
                   />
                   <button 
                    onClick={handleUpdatePasscode}
                    className="bg-slate-800 hover:bg-black text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all"
                   >
                     更新口令
                   </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">课程名称</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">状态</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">阅读量</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {articles.map(article => (
                      <tr key={article.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                           <div className="font-bold text-slate-800">{article.title}</div>
                           <div className="text-[11px] text-slate-400 mt-0.5">作者: {article.author} · {new Date(article.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${article.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                             {article.isPublished ? '已上线' : '草稿'}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-slate-600">
                           {article.viewCount}
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => { setEditingArticleId(article.id); setShowEditor(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                              <button onClick={() => handleDeleteArticle(article.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {articles.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">还没有任何课件，点击右上角开始创作吧。</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
