import React, { useState, useEffect } from 'react';
import { AuthForm } from './packages/web/components/auth/AuthForm.tsx';
import { OtpInput } from './packages/web/components/auth/OtpInput.tsx';
import { OnboardingForm } from './packages/web/components/profile/OnboardingForm.tsx';
import { ChatWindow } from './apps/web/components/chat/ChatWindow.tsx';
import { ActiveCallContainer } from './apps/web/components/calls/ActiveCallContainer.tsx';
import { IncomingCallModal } from './apps/web/components/calls/IncomingCallModal.tsx';
import { MinimizedCallPill } from './apps/web/components/calls/MinimizedCallPill.tsx';
import { SettingsPage } from './apps/web/components/settings/SettingsPage.tsx';
import { WelcomeScreen } from './apps/web/components/welcome/WelcomeScreen.tsx';
import { PricingTable } from './apps/web/components/pricing/PricingTable.tsx';
import { profileService } from './packages/services/profile-service.ts';
import { authService } from './packages/services/auth-service.ts';
import { MessageSquare, Bell, LayoutGrid, Layers, Ghost, X, ArrowLeft } from 'lucide-react';

type AppState = 'loading' | 'welcome' | 'auth' | 'otp' | 'onboarding' | 'dashboard' | 'pricing';
type NavTab = 'chats' | 'stories' | 'notifications';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<'signUp' | 'signIn'>('signUp');
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ phone?: string; email?: string } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Call States
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; peer: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ type: 'audio' | 'video'; peer: string } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkSession = async () => {
      try {
        const client = authService.getSupabase();
        if (!client) {
          console.warn('App: Supabase client not initialized yet.');
          throw new Error('Config missing');
        }
        
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error || !session) {
          throw new Error('No active session found.');
        }
        
        const currentUser = session.user;
        setUserId(currentUser.id);
        
        // Check if onboarding is completed by looking for a username
        const profile = await profileService.getProfile(currentUser.id);
        if (!profile || !profile.username) {
          setAppState('onboarding');
        } else {
          setAppState('dashboard');
        }
      } catch (err) {
        console.log('App: Redirecting to welcome screen...');
        // Visual delay for the loading animation brand experience
        setTimeout(() => setAppState('welcome'), 1200);
      }
    };
    
    checkSession();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleStartCall = (type: 'audio' | 'video', peer: string) => {
    setActiveCall({ type, peer });
    setIsMinimized(false);
  };

  const handleAuthSuccess = async (data: any) => {
    if (data.step === 'otp' || data.phone) {
      setPendingAuth({ phone: data.phone });
      setAppState('otp');
    } else {
      const user = data.user || data;
      setUserId(user.id);
      
      const profile = await profileService.getProfile(user.id);
      if (!profile || !profile.username) {
        setAppState('onboarding');
      } else {
        setAppState('dashboard');
      }
    }
  };

  // --- SCREEN RENDERERS ---

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#2B2F36] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-[#007BFF] rounded-2xl flex items-center justify-center text-white text-3xl font-black italic shadow-[0_0_40px_rgba(0,123,255,0.3)] animate-pulse">
          M
        </div>
        <div className="flex flex-col items-center gap-2">
           <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] italic">Neural Network</span>
           <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-[#007BFF] animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
           </div>
        </div>
      </div>
    );
  }

  if (appState === 'welcome') {
    return (
      <div className="relative">
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[200] bg-[#EF4444] text-white py-2 px-4 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top duration-300">
            No connection. Retry?
            <button onClick={() => window.location.reload()} className="bg-white/20 px-3 py-1 rounded-md hover:bg-white/30 transition-colors">Retry</button>
          </div>
        )}
        <WelcomeScreen 
          onGetStarted={() => { setAuthMode('signUp'); setAppState('auth'); }} 
          onSignIn={() => { setAuthMode('signIn'); setAppState('auth'); }} 
          onViewPlans={() => setAppState('pricing')}
          sessionExpired={sessionExpired}
        />
      </div>
    );
  }

  if (appState === 'pricing') {
    return (
      <div className="min-h-screen bg-[#2B2F36] p-8 flex flex-col items-center">
        <div className="w-full max-w-7xl mb-12 flex items-center justify-between">
          <button onClick={() => setAppState('welcome')} className="flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Welcome</span>
          </button>
          <div className="w-10 h-10 bg-[#007BFF] rounded-xl flex items-center justify-center text-white font-black italic">M</div>
        </div>
        <PricingTable />
      </div>
    );
  }

  if (appState === 'auth') {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <AuthForm 
          initialMode={authMode} 
          onBack={() => setAppState('welcome')} 
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  if (appState === 'otp') {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <OtpInput 
          phone={pendingAuth?.phone || ''}
          email={pendingAuth?.email || ''}
          onBack={() => setAppState('auth')}
          onSuccess={(data) => {
            const user = data.user || data;
            setUserId(user.id);
            setAppState('onboarding');
          }}
        />
      </div>
    );
  }

  if (appState === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center md:bg-[#F5F7FA]">
        <OnboardingForm userId={userId!} onComplete={() => setAppState('dashboard')} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#2B2F36] flex flex-col md:flex-row overflow-hidden relative selection:bg-[#007BFF]/30">
      
      {/* 1. GLOBAL NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#1F2329] border-t border-white/5 md:relative md:h-full md:w-24 md:border-t-0 md:border-r flex md:flex-col items-center justify-between py-6 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div className="hidden md:flex flex-col items-center gap-10">
           <div className="w-12 h-12 bg-[#007BFF] rounded-[18px] flex items-center justify-center text-white text-xl font-black italic shadow-lg hover:scale-105 transition-transform cursor-pointer">M</div>
        </div>
        
        <div className="flex md:flex-col items-center justify-center gap-10 md:gap-10 flex-1 px-8 md:px-0">
          <button 
            onClick={() => setActiveTab('chats')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chats' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}
          >
            <MessageSquare size={26} strokeWidth={activeTab === 'chats' ? 2.5 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('stories')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stories' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}
          >
            <Layers size={26} strokeWidth={activeTab === 'stories' ? 2.5 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('notifications')} 
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notifications' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}
          >
            <Bell size={26} strokeWidth={activeTab === 'notifications' ? 2.5 : 2} />
          </button>
          <button 
            onClick={() => setShowSettings(true)} 
            className={`flex flex-col items-center gap-1 transition-all text-white/30 hover:text-white`}
          >
            <LayoutGrid size={26} />
          </button>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="hidden md:block w-10 h-10 rounded-2xl bg-white/5 border border-white/5 overflow-hidden transition-all hover:border-[#39FF14]/50 group"
        >
          <div className="w-full h-full bg-[#3A3F47] flex items-center justify-center text-white/40 group-hover:text-[#39FF14]">
            <Ghost size={20} />
          </div>
        </button>
      </nav>

      {/* 2. MAIN WORKSPACE */}
      <div className={`flex-1 flex flex-col md:flex-row h-screen transition-all duration-700 pb-16 md:pb-0
        ${activeCall && !isMinimized ? 'scale-95 blur-2xl opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        
        <aside className={`w-full md:w-80 lg:w-96 bg-[#1F2329]/50 border-r border-white/5 flex flex-col ${activeTab !== 'chats' ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-6 pb-2">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase underline decoration-[#007BFF] decoration-4 underline-offset-8">Conversations</h2>
                 <button className="p-2 bg-[#007BFF]/10 text-[#007BFF] rounded-xl hover:bg-[#007BFF] hover:text-white transition-all">
                    <MessageSquare size={18} />
                 </button>
              </div>
              <div className="relative mb-6">
                 <input type="text" placeholder="Search Frequency..." className="w-full bg-[#2B2F36] border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#007BFF]/40 transition-all" />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
              <div className="p-4 bg-white/5 rounded-2xl border border-[#39FF14]/20 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group border-l-4 border-l-[#39FF14] shadow-lg shadow-[#39FF14]/5">
                 <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-white/5" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#39FF14] rounded-full border-[3px] border-[#1F2329] shadow-[0_0_10px_#39FF14]"></div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <p className="text-sm font-black text-white uppercase italic truncate">Sophia Bennett</p>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] font-bold truncate">Establishing neural handshake...</p>
                 </div>
              </div>
           </div>
        </aside>

        <section className="flex-1 relative flex flex-col bg-[#2B2F36] min-w-0">
          {activeCall && isMinimized && (
            <MinimizedCallPill 
              peerName={activeCall.peer} 
              callType={activeCall.type} 
              onExpand={() => setIsMinimized(false)} 
              onEnd={() => setActiveCall(null)}
            />
          )}

          {activeTab === 'chats' && (
            <ChatWindow 
              chatId="demo-chat" 
              currentUserId={userId!} 
              recipientName="Sophia Bennett" 
              onStartCall={(type) => handleStartCall(type, "Sophia Bennett")}
            />
          )}
        </section>
      </div>

      {showSettings && (
        <SettingsPage userId={userId!} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
};

export default App;