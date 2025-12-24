
import React, { useState, useRef } from 'react';
import { Article, ArticleSegment, VocabularyItem } from '../types';

interface ArticleEditorProps {
  onSave: (article: Omit<Article, 'id' | 'createdAt' | 'viewCount' | 'isPublished'>) => void;
  initialArticle?: Article;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ onSave, initialArticle }) => {
  const [step, setStep] = useState<1 | 2>(initialArticle ? 2 : 1);
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [author, setAuthor] = useState(initialArticle?.author || '');
  const [tags, setTags] = useState(initialArticle?.tags.join(', ') || '');
  const [coverImage, setCoverImage] = useState(initialArticle?.coverImage || '');
  const [rawContent, setRawContent] = useState('');
  const [segments, setSegments] = useState<ArticleSegment[]>(initialArticle?.segments || []);
  const [vocab, setVocab] = useState<VocabularyItem[]>(initialArticle?.keyVocabulary || []);
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');
  
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const splitIntoSentences = (text: string) => {
    const regex = /[^.!?。\！\？\n]+[.!?。\！\？\n]*/g;
    const matches = text.match(regex) || [text];
    return matches
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => ({
        id: Math.random().toString(36).substr(2, 9),
        text: s,
        translation: ''
      }));
  };

  const handleNextStep = () => {
    if (!title || (!rawContent && segments.length === 0)) return;
    if (segments.length === 0) {
      setSegments(splitIntoSentences(rawContent));
    }
    setStep(2);
  };

  const handleCoverUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCoverImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAddVocab = () => {
    if (!newWord.trim()) return;
    const item: VocabularyItem = {
      id: Math.random().toString(36).substr(2, 9),
      word: newWord.trim(),
      definition: newDef.trim()
    };
    setVocab([...vocab, item]);
    setNewWord('');
    setNewDef('');
  };

  const removeVocab = (id: string) => {
    setVocab(vocab.filter(v => v.id !== id));
  };

  const handleFileUpload = (id: string, file: File, isVocab: boolean = false) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      if (isVocab) {
        setVocab(prev => prev.map(v => v.id === id ? { ...v, audioData: base64 } : v));
      } else {
        setSegments(prev => prev.map(s => s.id === id ? { ...s, audioData: base64 } : s));
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSegmentField = (id: string, field: keyof ArticleSegment, value: string) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const playPreview = async (audioData: string, id: string) => {
    if (audioRef.current) audioRef.current.close();
    const ctx = new AudioContext();
    audioRef.current = ctx;
    setPreviewingId(id);

    try {
      const bytes = atob(audioData);
      const arrayBuffer = new Uint8Array(bytes.length);
      for(let i=0; i<bytes.length; i++) arrayBuffer[i] = bytes.charCodeAt(i);
      
      let buffer: AudioBuffer;
      try {
        buffer = await ctx.decodeAudioData(arrayBuffer.buffer);
      } catch (e) {
        const dataInt16 = new Int16Array(arrayBuffer.buffer);
        buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setPreviewingId(null);
      source.start();
    } catch (e) {
      setPreviewingId(null);
    }
  };

  const handleSubmit = () => {
    if (segments.length === 0) {
      alert("请至少保留一个段落片段");
      return;
    }
    onSave({
      title,
      author: author || '名师AI',
      segments,
      keyVocabulary: vocab,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      coverImage: coverImage,
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden mb-12">
      <div className="p-6 sm:p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {step === 1 ? '第一步：内容发布' : '精修文章音频与词汇'}
          </h2>
          <p className="text-blue-100 text-xs mt-1 font-medium opacity-90">
            {step === 1 ? '输入内容后，系统将自动断句' : '请确保为每个段落和词汇手动上传音频'}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">文章封面</label>
                <div 
                  className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                    ${coverImage ? 'border-transparent' : 'border-gray-200 hover:border-blue-400 bg-gray-50'}`}
                >
                  {coverImage ? (
                    <>
                      <img src={coverImage} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-blue-600 px-3 py-1.5 rounded-full">更换图片</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <p className="text-[10px] font-bold text-gray-400">点击上传封面</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && handleCoverUpload(e.target.files[0])} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <input
                  type="text"
                  placeholder="文章标题"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-gray-800"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="作者"
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-semibold text-gray-800"
                  />
                  <input
                    type="text"
                    placeholder="标签 (逗号分隔)"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none font-semibold text-gray-800"
                  />
                </div>
              </div>
            </div>
            
            {!initialArticle && (
              <textarea
                placeholder="在此粘贴文章内容..."
                value={rawContent}
                onChange={e => setRawContent(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none h-64 resize-none leading-relaxed text-gray-800"
              />
            )}
            
            <button
              onClick={handleNextStep}
              disabled={!title || (!rawContent && segments.length === 0)}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg transition-all"
            >
              下一步：管理上传音频
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                重点词汇发音上传
              </h3>
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-6">
                <div className="flex flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="单词/短语"
                    value={newWord}
                    onChange={e => setNewWord(e.target.value)}
                    className="flex-1 min-w-[150px] px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                  />
                  <input
                    type="text"
                    placeholder="释义"
                    value={newDef}
                    onChange={e => setNewDef(e.target.value)}
                    className="flex-[2] min-w-[200px] px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm outline-none"
                  />
                  <button
                    onClick={handleAddVocab}
                    className="px-6 py-2 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700"
                  >
                    添加词汇
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vocab.map(v => (
                    <div key={v.id} className="bg-white border border-gray-100 p-4 rounded-2xl flex flex-col gap-3 shadow-sm relative">
                      <button onClick={() => removeVocab(v.id)} className="absolute top-3 right-3 text-red-300 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                      <div>
                        <span className="font-black text-blue-600 text-base">{v.word}</span>
                        <p className="text-gray-500 text-xs mt-1">{v.definition}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         {v.audioData && (
                           <button onClick={() => playPreview(v.audioData!, v.id)} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${previewingId === v.id ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'}`}>
                             {previewingId === v.id ? '试听中' : '试听'}
                           </button>
                         )}
                         <label className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-gray-200">
                           {v.audioData ? '更换音频' : '上传音频'}
                           <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files && handleFileUpload(v.id, e.target.files[0], true)} />
                         </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                段落发音上传
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {segments.map((s, index) => (
                  <div key={s.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                    <div className="absolute top-4 right-4">
                      <button onClick={() => deleteSegment(s.id)} className="p-2 text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <span className="mt-2 text-blue-400 font-mono text-sm font-bold">{index + 1}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{s.text}</p>
                        <input
                          type="text"
                          placeholder="翻译..."
                          value={s.translation || ''}
                          onChange={(e) => updateSegmentField(s.id, 'translation', e.target.value)}
                          className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      {s.audioData && (
                        <button
                          onClick={() => playPreview(s.audioData!, s.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            previewingId === s.id ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          试听句子
                        </button>
                      )}
                      <label className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-300">
                        {s.audioData ? '更换音频' : '上传音频文件'}
                        <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files && handleFileUpload(s.id, e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">返回修改基础信息</button>
              <button onClick={handleSubmit} className="flex-[2] px-6 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg uppercase tracking-widest text-sm">完成并保存文章</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleEditor;
