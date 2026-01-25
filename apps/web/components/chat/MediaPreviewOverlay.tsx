
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Edit3, Trash2, Send, FileText, Play, RotateCw, Check, AlertCircle, Info } from 'lucide-react';
import { usageService } from '../../../../packages/services/usage-service.ts';
import { UsageSummary } from '../../../../packages/types/index.ts';

interface MediaFile {
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'document';
  caption: string;
  rotation: number;
  filter: string;
}

interface MediaPreviewOverlayProps {
  files: File[];
  userId: string;
  onClose: () => void;
  onSend: (mediaFiles: { file: File, caption: string, metadata: any }[]) => void;
}

const FILTERS = [
  { name: 'Original', class: '' },
  { name: 'B&W', class: 'grayscale' },
  { name: 'Vintage', class: 'sepia contrast-125' },
  { name: 'Cool', class: 'hue-rotate-180 brightness-110' },
  { name: 'Warm', class: 'sepia(0.5) saturate-150' },
];

export const MediaPreviewOverlay: React.FC<MediaPreviewOverlayProps> = ({
  files: initialFiles,
  userId,
  onClose,
  onSend
}) => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize media list
  useEffect(() => {
    const list = initialFiles.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: f.type.startsWith('image/') ? 'image' : f.type.startsWith('video/') ? 'video' : ('document' as any),
      caption: '',
      rotation: 0,
      filter: ''
    }));
    setMediaList(list);
    return () => list.forEach(m => URL.revokeObjectURL(m.previewUrl));
  }, [initialFiles]);

  // Fetch Usage for Quota Enforcement
  useEffect(() => {
    usageService.getUserUsageSummary(userId).then(setUsage);
  }, [userId]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDiscardConfirm || isEditing) return;
      if (e.key === 'Escape') setShowDiscardConfirm(true);
      if (e.key === 'ArrowLeft') setActiveIndex(p => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setActiveIndex(p => Math.min(mediaList.length - 1, p + 1));
      if (e.key === 'Enter' && e.ctrlKey) handleSend();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mediaList.length, showDiscardConfirm, isEditing]);

  const activeMedia = mediaList[activeIndex];
  
  const totalBatchSize = useMemo(() => 
    mediaList.reduce((acc, m) => acc + m.file.size, 0)
  , [mediaList]);

  const storageStatus = useMemo(() => {
    if (!usage) return 'normal';
    const projectedUsage = usage.storage.used + totalBatchSize;
    const percent = (projectedUsage / usage.storage.limit) * 100;
    if (percent >= 100) return 'blocked';
    if (percent >= 80) return 'warning';
    return 'normal';
  }, [usage, totalBatchSize]);

  const handleRemove = (index: number) => {
    const newList = [...mediaList];
    URL.revokeObjectURL(newList[index].previewUrl);
    newList.splice(index, 1);
    setMediaList(newList);
    if (newList.length === 0) onClose();
    else setActiveIndex(prev => Math.min(prev, newList.length - 1));
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newList = [...mediaList];
    const item = newList.splice(draggedIndex, 1)[0];
    newList.splice(index, 0, item);
    setMediaList(newList);
    setDraggedIndex(index);
    setActiveIndex(index);
  };

  const handleSend = () => {
    if (storageStatus === 'blocked') return;
    onSend(mediaList.map(m => ({ 
      file: m.file, 
      caption: m.caption,
      metadata: { rotation: m.rotation, filter: m.filter }
    })));
  };

  if (mediaList.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300 select-none">
      
      {/* Top Bar */}
      <div className="h-16 px-6 flex items-center justify-between shrink-0 z-10">
        <button 
          onClick={() => setShowDiscardConfirm(true)} 
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Cancel and discard media"
        >
          <X size={24} />
        </button>
        
        {mediaList.length > 1 && (
          <span className="text-[10px] font-black text-white italic uppercase tracking-[0.4em] translate-x-4" aria-live="polite">
            {activeIndex + 1} <span className="text-white/20 mx-1">/</span> {mediaList.length}
          </span>
        )}

        <div className="flex items-center gap-2">
          {activeMedia.type === 'image' && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all border ${
                isEditing ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'text-white/60 hover:text-white border-white/10'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 relative flex items-center justify-center p-4 md:p-12 overflow-hidden">
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-500 ease-out"
          style={{ 
            transform: `rotate(${activeMedia.rotation}deg)`,
            filter: activeMedia.filter 
          }}
        >
          {activeMedia.type === 'image' && (
            <img 
              src={activeMedia.previewUrl} 
              className={`max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-300 ${activeMedia.filter}`} 
              alt={`Preview ${activeIndex + 1}`}
            />
          )}
          {activeMedia.type === 'video' && (
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group">
              <video 
                src={activeMedia.previewUrl} 
                className="w-full h-full" 
                controls 
              />
            </div>
          )}
          {activeMedia.type === 'document' && (
            <div className="flex flex-col items-center gap-6 p-12 glass rounded-[40px] border border-white/10">
              <div className="w-24 h-24 rounded-3xl bg-[#007BFF]/10 flex items-center justify-center text-[#007BFF]">
                <FileText size={48} />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg truncate max-w-[300px]">{activeMedia.file.name}</p>
                <p className="text-[#9CA3AF] text-[10px] font-black uppercase mt-1 tracking-widest">
                  {(activeMedia.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Overlay (Image Only) */}
        {isEditing && activeMedia.type === 'image' && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-24 z-20 animate-in fade-in duration-300">
            <div className="glass p-6 rounded-[32px] border border-white/10 flex flex-col gap-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Image Lab</h4>
                <button 
                  onClick={() => {
                    const newList = [...mediaList];
                    newList[activeIndex].rotation = (newList[activeIndex].rotation + 90) % 360;
                    setMediaList(newList);
                  }}
                  className="flex items-center gap-2 text-[#007BFF] font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 p-2 rounded-lg transition-all"
                >
                  <RotateCw size={14} /> Rotate
                </button>
              </div>
              
              <div className="space-y-3">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest px-1">Filters</span>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => {
                        const newList = [...mediaList];
                        newList[activeIndex].filter = f.class;
                        setMediaList(newList);
                      }}
                      className={`flex flex-col items-center gap-2 shrink-0 group ${
                        activeMedia.filter === f.class ? 'scale-105' : 'opacity-60'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl border-2 transition-all overflow-hidden ${
                        activeMedia.filter === f.class ? 'border-[#007BFF]' : 'border-transparent group-hover:border-white/20'
                      }`}>
                        <img src={activeMedia.previewUrl} className={`w-full h-full object-cover ${f.class}`} alt={f.name} />
                      </div>
                      <span className="text-[8px] font-bold text-white uppercase">{f.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interface */}
      <div className="shrink-0 p-6 space-y-6">
        {/* Thumbnail Strip with Drag and Drop */}
        {mediaList.length > 1 && (
          <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 no-scrollbar h-20">
            {mediaList.map((m, i) => (
              <div 
                key={i} 
                className="relative shrink-0 group"
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
              >
                <button 
                  onClick={() => setActiveIndex(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    activeIndex === i ? 'border-[#007BFF] scale-110 shadow-[0_0_20px_rgba(0,123,255,0.3)]' : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  {m.type === 'image' ? (
                    <img src={m.previewUrl} className={`w-full h-full object-cover ${m.filter}`} style={{ transform: `rotate(${m.rotation}deg)` }} />
                  ) : (
                    <div className="w-full h-full bg-[#1F2329] flex items-center justify-center text-white/40">
                      {m.type === 'video' ? <Play size={16} /> : <FileText size={16} />}
                    </div>
                  )}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove file"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Caption & Send */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="relative group/caption">
            <textarea
              value={activeMedia.caption}
              onChange={(e) => {
                const newList = [...mediaList];
                newList[activeIndex].caption = e.target.value.slice(0, 200);
                setMediaList(newList);
              }}
              placeholder="Add caption..."
              className="w-full bg-[#1F2329] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#007BFF] resize-none h-14 transition-all"
            />
            <span className={`absolute bottom-3 right-4 text-[9px] font-black uppercase tracking-widest transition-colors ${
              activeMedia.caption.length >= 200 ? 'text-[#EF4444]' : 'text-white/20 group-focus-within/caption:text-white/60'
            }`}>
              {activeMedia.caption.length} <span className="text-white/10 mx-1">/</span> 200
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              {storageStatus === 'blocked' ? (
                <div className="flex items-center gap-3 text-[#EF4444] animate-pulse">
                  <AlertCircle size={16} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Storage full. Upgrade required.</span>
                </div>
              ) : storageStatus === 'warning' ? (
                <div className="flex items-center gap-3 text-[#F59E0B]">
                  <Info size={16} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Low storage: {((usage!.storage.limit - usage!.storage.used - totalBatchSize) / 1024 / 1024).toFixed(0)} MB remaining</span>
                </div>
              ) : null}
            </div>

            <button 
              onClick={handleSend}
              disabled={storageStatus === 'blocked'}
              aria-label="Send media"
              className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 group relative ${
                storageStatus === 'blocked' ? 'bg-[#2B2F36] opacity-50' : 'bg-[#007BFF] hover:bg-blue-600 hover:shadow-[0_0_30px_rgba(0,123,255,0.4)]'
              }`}
            >
              <Send size={24} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              {storageStatus === 'blocked' && (
                <div className="absolute bottom-full right-0 mb-4 w-48 p-3 bg-black border border-white/10 rounded-xl text-[10px] text-[#EF4444] font-bold text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  Neural link blocked: Storage limit reached.
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="absolute inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm glass p-8 rounded-[40px] border border-[#EF4444]/20 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-[#EF4444]/10 rounded-[24px] flex items-center justify-center text-[#EF4444] mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Discard Media?</h3>
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest leading-relaxed mb-8">All selected files and neural edits will be lost.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Keep Editing
              </button>
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-[#EF4444] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
