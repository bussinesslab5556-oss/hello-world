
import React, { useState, useRef, useEffect } from 'react';
import { storageService } from '../../../../packages/services/storage-service.ts';
import { chatService } from '../../../../packages/services/chat-service.ts';
import { MediaPreviewOverlay } from './MediaPreviewOverlay.tsx';

interface ChatInputProps {
  onSend: (text: string) => void;
  currentUserId: string;
  chatId: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, currentUserId, chatId, disabled }) => {
  const [message, setMessage] = useState('');
  const [activeTone] = useState<'Professional' | 'Casual' | 'Negotiation'>('Professional');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => adjustHeight(), [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    e.target.value = ''; 
  };

  const processMediaUploads = async (mediaFiles: { file: File, caption: string }[]) => {
    setPendingFiles(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const attachmentPayloads: any[] = [];
    let completed = 0;
    const total = mediaFiles.length;

    try {
      // Step 1: Sequential Binary Uploads
      for (const media of mediaFiles) {
        const { file } = media;
        const prov = await storageService.getUploadUrl(currentUserId, file.name, file.size, file.type);
        
        if (prov.error) throw new Error(prov.status === 402 ? 'QUOTA_EXCEEDED' : prov.error);

        await storageService.uploadFile(prov.url!, file, (progress) => {
          const overall = ((completed * 100) + progress) / total;
          setUploadProgress(Math.round(overall));
        });

        attachmentPayloads.push({
          key: prov.key,
          size: file.size,
          type: file.type,
          media_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
          metadata: { name: file.name } // Metadata parsing happens on server
        });
        
        completed++;
      }

      // Step 2: ATOMIC COMMIT
      const combinedCaption = mediaFiles.map(m => m.caption).filter(c => c).join('; ');
      const success = await chatService.sendBatchMediaMessage(
        chatId, 
        currentUserId, 
        combinedCaption, 
        attachmentPayloads
      );

      if (!success) throw new Error('COMMIT_FAILED');

    } catch (err: any) {
      setUploadError(err.message === 'QUOTA_EXCEEDED' ? 'Storage full' : 'Upload failed');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) onSend('[Voice Note Captured]');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 relative">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,video/*,application/pdf" />

      {(isUploading || uploadError) && (
        <div className="absolute -top-14 left-0 w-full px-2 z-10 animate-in slide-in-from-bottom-2">
          <div className={`glass rounded-2xl p-4 shadow-2xl flex items-center gap-4 border ${uploadError ? 'border-[#EF4444]/30' : 'border-[#39FF14]/30'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uploadError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#39FF14]/10 text-[#39FF14]'}`}>
              {uploadError ? <AlertCircleIcon /> : <UploadIcon />}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase tracking-widest ${uploadError ? 'text-[#EF4444]' : 'text-white'}`}>{uploadError || 'Neural Syncing Media...'}</span>
                {!uploadError && <span className="text-[9px] font-black text-[#39FF14]">{uploadProgress}%</span>}
              </div>
              {!uploadError && <div className="w-full h-1 bg-[#2B2F36] rounded-full overflow-hidden"><div className="h-full bg-[#39FF14] transition-all duration-300 shadow-[0_0_10px_#39FF14]" style={{ width: `${uploadProgress}%` }} /></div>}
            </div>
          </div>
        </div>
      )}

      {pendingFiles && <MediaPreviewOverlay files={pendingFiles} userId={currentUserId} onClose={() => setPendingFiles(null)} onSend={processMediaUploads} />}

      <div className="flex items-end gap-2 px-2">
        <div className="flex items-center gap-1.5 shrink-0 mb-1">
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full bg-[#1F2329] border border-[#3A3F47] flex items-center justify-center text-[#39FF14] hover:bg-[#39FF14]/10 transition-all active:scale-90"><AttachmentIcon /></button>
          <button onClick={toggleRecording} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isRecording ? 'bg-[#EF4444] text-white animate-pulse' : 'bg-[#1F2329] border-[#3A3F47] text-[#39FF14]'}`}><MicIcon /></button>
        </div>
        <div className="flex-1 relative"><textarea ref={textareaRef} rows={1} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Neural Input [${activeTone}]...`} disabled={disabled || isRecording} className="w-full bg-[#1F2329] border border-[#3A3F47] rounded-2xl px-5 py-3.5 text-[14px] text-white outline-none focus:border-[#39FF14] transition-all resize-none min-h-[48px] max-h-[120px]" /></div>
        <button onClick={handleSend} disabled={!message.trim() || disabled || isRecording} className="w-11 h-11 shrink-0 rounded-full bg-[#007BFF] hover:bg-blue-600 disabled:bg-[#3A3F47] text-white flex items-center justify-center transition-all shadow-lg active:scale-95 mb-0.5"><SendIcon /></button>
      </div>
    </div>
  );
};

const AlertCircleIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2.5}/></svg>;
const UploadIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeWidth={2.5}/></svg>;
const AttachmentIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MicIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3.5 3 3 0 01-3-3.5V6a3 3 0 013-3z" /></svg>;
const SendIcon = () => <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>;
