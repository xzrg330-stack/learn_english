
import React from 'react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  onDelete?: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onDelete }) => {
  const previewText = article.segments.map(s => s.text).join(' ').slice(0, 150) + (article.segments.length > 0 ? '...' : '');
  
  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="aspect-video bg-slate-100 relative overflow-hidden">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-50 to-slate-200">
            <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{article.title}</span>
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-1 pr-12">
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-white/90 backdrop-blur shadow-sm rounded text-[9px] font-black uppercase text-blue-600">
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg flex items-center gap-1.5 text-white text-[10px] font-bold">
           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
           {article.viewCount}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2 leading-tight">
          {article.title}
        </h3>
        <p className="text-gray-500 text-xs line-clamp-3 flex-1 mb-4 leading-relaxed font-medium">
          {previewText}
        </p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-black">
              {article.author[0].toUpperCase()}
            </div>
            <span className="text-xs font-bold text-gray-700">{article.author}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
