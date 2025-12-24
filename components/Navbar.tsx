
import React from 'react';

interface ReaderNavbarProps {
  // 移除了 onManageClick 属性
}

export const ReaderNavbar: React.FC<ReaderNavbarProps> = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">AI</div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">AI动画英语</span>
        </div>
      </div>
    </nav>
  );
};

interface AdminNavbarProps {
  onBackClick: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onBackClick }) => {
  return (
    <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 px-6 py-4 text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase">Admin</div>
          <span className="font-bold text-lg">内容管理后台</span>
        </div>
        <button 
          onClick={onBackClick}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        >
          返回前台
        </button>
      </div>
    </nav>
  );
};
