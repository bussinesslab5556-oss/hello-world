
import React, { useState } from 'react';
import { X, Search, Users, User, ArrowRight } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contactId: string) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'group'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1F2329] rounded-[32px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">New Conversation</h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex bg-[#2B2F36] p-1 rounded-xl mb-6">
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'contacts' ? 'bg-[#007BFF] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <User size={14} /> Contacts
            </button>
            <button 
              onClick={() => setActiveTab('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'group' ? 'bg-[#007BFF] text-white' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Users size={14} /> New Group
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or @username..."
              className="w-full h-12 bg-[#2B2F36] border border-white/5 rounded-2xl pl-12 pr-4 text-sm text-white focus:border-[#007BFF] outline-none transition-all"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {/* Mock data for demonstration - in real app, fetch from profiles */}
          {[1, 2, 3, 4, 5].map((i) => (
            <button 
              key={i}
              onClick={() => { onSelect(`user-${i}`); onClose(); }}
              className="w-full p-4 flex items-center gap-4 rounded-2xl hover:bg-white/[0.03] transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-[#3A3F47] flex items-center justify-center font-black text-white text-xs border border-white/5">
                U
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-white group-hover:text-[#007BFF] transition-colors">User {i}</p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">@user_handle_{i}</p>
              </div>
              <ArrowRight size={16} className="text-white/10 group-hover:text-[#007BFF] transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        {activeTab === 'group' && (
          <div className="p-6 bg-[#2B2F36]/50 border-t border-white/5 shrink-0">
            <button className="w-full h-12 bg-[#39FF14] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-[#32e012] transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)]">
              Create Group Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
