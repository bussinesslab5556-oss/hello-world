
import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../../../../packages/services/chat-service.ts';

interface MessageBubbleProps {
  id: string;
  originalText: string;
  translatedText?: string;
  isMine: boolean;
  timestamp: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'error';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  id, originalText, translatedText, isMine, timestamp, isEdited, isDeleted, status 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(originalText || '');
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [hiddenLocally, setHiddenLocally] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!isEditing) setEditText(originalText || '');
  }, [originalText, isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isDeleted) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const submitEdit = async () => {
    if (editText.trim() !== originalText) {
      await chatService.editMessage(id, editText);
    }
    setIsEditing(false);
  };

  const handleDelete = async (type: 'me' | 'everyone') => {
    if (type === 'me') {
      setHiddenLocally(true);
    } else {
      await chatService.deleteMessage(id, type);
    }
    setShowMenu(false);
  };

  if (hiddenLocally) return null;

  return (
    <div 
      className={`flex w-full group/msg relative ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${isMine ? 'right' : 'left'}-2 duration-300`}
      onContextMenu={handleContextMenu}
    >
      <div 
        className={`max-w-[85%] px-4 py-3 rounded-[20px] relative shadow-lg transition-all duration-300 min-h-[44px] ${
          isDeleted ? 'bg-[#1F2329] border border-white/5 text-[#9CA3AF] italic' :
          status === 'error' ? 'bg-[#EF4444]/20 border border-[#EF4444]/40 text-white' :
          isMine 
            ? 'bg-[#007BFF] text-white rounded-tr-none shadow-[0_5px_15px_rgba(0,123,255,0.15)]' 
            : 'bg-[#3A3F47] text-white rounded-tl-none border border-white/5'
        }`}
      >
        {isDeleted ? (
          <p className="text-[13px] opacity-70 tracking-tight italic">🚫 This message was deleted</p>
        ) : isEditing ? (
          <div className="flex flex-col gap-3 min-w-[220px]">
            <textarea
              autoFocus
              className="w-full bg-[#1F2329] text-white rounded-xl p-3 text-sm border border-[#39FF14]/30 outline-none focus:border-[#39FF14] resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="text-[9px] font-black uppercase text-white/50 tracking-widest">Cancel</button>
              <button onClick={submitEdit} className="text-[9px] font-black uppercase text-[#39FF14] tracking-widest">Update</button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {translatedText && (
              <p className="text-[15px] font-black text-[#39FF14] leading-[1.4] tracking-tight animate-in fade-in">
                {translatedText}
              </p>
            )}
            <p className={`${translatedText ? 'text-[12px] text-white/60' : 'text-[15px] text-white'} font-medium leading-[1.4] whitespace-pre-wrap break-words`}>
              {/* FALLBACK RENDERING: Ensure content is visible regardless of property naming */}
              <span>{originalText || (status === 'error' ? 'Transmission failed' : 'Empty Content')}</span>
              {isEdited && !isDeleted && (
                <span className="text-[9px] font-black text-white/30 ml-2 uppercase italic tracking-tighter">(edited)</span>
              )}
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 mt-1.5 justify-end select-none opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black uppercase tracking-widest">{formattedTime}</span>
          {isMine && !isDeleted && (
            <div className="flex items-center">
              {status === 'error' ? (
                 <svg className="w-3.5 h-3.5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
              ) : (
                <>
                  <svg className={`w-3 h-3 ${status === 'read' ? 'text-[#39FF14]' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {(status === 'delivered' || status === 'read') && (
                    <svg className={`w-3 h-3 -ml-2 ${status === 'read' ? 'text-[#39FF14]' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showMenu && (
        <div 
          ref={menuRef}
          className="fixed z-[200] w-44 bg-[#1F2329]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 animate-in zoom-in duration-100"
          style={{ top: menuPos.y, left: Math.min(menuPos.x, window.innerWidth - 180) }}
        >
          {isMine && (
            <button onClick={handleEdit} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-white hover:bg-[#39FF14]/10 hover:text-[#39FF14] flex items-center gap-3 transition-all tracking-widest">
               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               Edit
            </button>
          )}
          <button onClick={() => handleDelete('me')} className="w-full px-4 py-2.5 text-left text-[10px] font-black uppercase text-white hover:bg-white/5 flex items-center gap-3 transition-all tracking-widest">
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             Delete
          </button>
        </div>
      )}
    </div>
  );
};
