import React, { useState, useEffect } from 'react';
import { AuthForm } from './packages/web/components/auth/AuthForm.tsx';
import { OtpInput } from './packages/web/components/auth/OtpInput.tsx';
import { OnboardingForm } from './packages/web/components/profile/OnboardingForm.tsx';
import { ChatWindow } from './apps/web/components/chat/ChatWindow.tsx';
import { MinimizedCallPill } from './apps/web/components/calls/MinimizedCallPill.tsx';
import { SettingsPage } from './apps/web/components/settings/SettingsPage.tsx';
import { WelcomeScreen } from './apps/web/components/welcome/WelcomeScreen.tsx';
import { PricingTable } from './apps/web/components/pricing/PricingTable.tsx';
import { profileService } from './packages/services/profile-service.ts';
import { authService } from './packages/services/auth-service.ts';
import { MessageSquare, Bell, LayoutGrid, Layers, Ghost, LogOut } from 'lucide-react';

type AppState = 'loading' | 'welcome' | 'auth' | 'otp' | 'onboarding' | 'dashboard' | 'pricing';
type NavTab = 'chats' | 'stories' | 'notifications';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [authMode, setAuthMode] = useState<'signUp' | 'signIn'>('signUp');
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingAuth, setPendingAuth] = useState<{ identifier: string; type: 'email' | 'phone' } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; peer: string } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkSession = async () => {
      try {
        const client = authService.getSupabase();
        if (!client) throw new Error('Config missing');
        
        const { data: { session } } = await client.auth.getSession();
        
        if (!session) {
          setAppState('welcome');
          return;
        }
        
        const user = session.user;
        setUserId(user.id);
        
        // Profile check
        const isComplete = await authService.checkProfileInitialization(user.id);
        setAppState(isComplete ? 'dashboard' : 'onboarding');
      } catch (err) {
        setAppState('welcome');
      }
    };
    
    checkSession();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAuthSuccess = async (data: any) => {
    if (data.step === 'otp') {
      setPendingAuth({ identifier: data.identifier, type: data.type });
      setAppState('otp');
    } else {
      const user = data.user || data;
      setUserId(user.id);
      const isComplete = await authService.checkProfileInitialization(user.id);
      setAppState(isComplete ? 'dashboard' : 'onboarding');
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUserId(null);
    setAppState('welcome');
  };

  // --- SCREEN RENDERERS ---

  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-[#2B2F36] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-[#007BFF] rounded-2xl flex items-center justify-center text-white text-3xl font-black italic shadow-[0_0_40px_rgba(0,123,255,0.3)] animate-pulse">
          M
        </div>
        <div className="flex flex-col items-center gap-2">
           <span className="text-[10px] font-black text-white uppercase tracking-[0.6em] italic opacity-50">Initializing Neural Link</span>
           <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-[#007BFF] animate-[loading_2s_infinite]" style={{ width: '40%' }}></div>
           </div>
        </div>
      </div>
    );
  }

  if (appState === 'welcome') {
    return (
      <WelcomeScreen 
        onGetStarted={() => { setAuthMode('signUp'); setAppState('auth'); }} 
        onSignIn={() => { setAuthMode('signIn'); setAppState('auth'); }} 
        onViewPlans={() => setAppState('pricing')}
      />
    );
  }

  if (appState === 'pricing') {
    return (
      <div className="min-h-screen bg-[#2B2F36] p-8 flex flex-col items-center">
        <PricingTable />
        <button onClick={() => setAppState('welcome')} className="mt-8 text-white/40 hover:text-white uppercase font-black text-[10px] tracking-widest">Back</button>
      </div>
    );
  }

  if (appState === 'auth') {
    return (
      <AuthForm 
        initialMode={authMode} 
        onBack={() => setAppState('welcome')} 
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (appState === 'otp') {
    return (
      <OtpInput 
        identifier={pendingAuth?.identifier || ''}
        type={pendingAuth?.type || 'email'}
        onBack={() => setAppState('auth')}
        onSuccess={async (data) => {
          const user = data.user || data;
          setUserId(user.id);
          const isComplete = await authService.checkProfileInitialization(user.id);
          setAppState(isComplete ? 'dashboard' : 'onboarding');
        }}
      />
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingForm userId={userId!} onComplete={() => setAppState('dashboard')} />;
  }

  return (
    <main className="min-h-screen bg-[#2B2F36] flex flex-col md:flex-row overflow-hidden relative">
      
      {/* GLOBAL NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#1F2329] border-t border-white/5 md:relative md:h-full md:w-24 md:border-t-0 md:border-r flex md:flex-col items-center justify-between py-6 z-[100] shadow-2xl">
        <div className="hidden md:flex flex-col items-center gap-10">
           <div className="w-12 h-12 bg-[#007BFF] rounded-[18px] flex items-center justify-center text-white text-xl font-black italic shadow-lg">M</div>
        </div>
        
        <div className="flex md:flex-col items-center justify-center gap-10 flex-1">
          <button onClick={() => setActiveTab('chats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chats' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <MessageSquare size={26} strokeWidth={2.5} />
          </button>
          <button onClick={() => setActiveTab('stories')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stories' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <Layers size={26} strokeWidth={2.5} />
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notifications' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <Bell size={26} strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowSettings(true)} className="text-white/30 hover:text-white">
            <LayoutGrid size={26} />
          </button>
        </div>

        <button onClick={handleLogout} className="hidden md:block text-white/20 hover:text-[#EF4444] transition-colors">
          <LogOut size={24} />
        </button>
      </nav>

      {/* WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row h-screen transition-all duration-700 pb-16 md:pb-0">
        <aside className="hidden md:flex w-80 lg:w-96 bg-[#1F2329]/50 border-r border-white/5 flex-col">
           <div className="p-6">
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-8">Conversations</h2>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-[#39FF14]/20 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-white/5" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-white uppercase italic truncate">Neural Agent</p>
                       <p className="text-[11px] text-[#9CA3AF] font-bold truncate">Establishing secure link...</p>
                    </div>
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

          <ChatWindow 
            chatId="demo-chat" 
            currentUserId={userId!} 
            recipientName="Neural Agent" 
            onStartCall={(type) => { setActiveCall({ type, peer: 'Neural Agent' }); setIsMinimized(false); }}
          />
        </section>
      </div>

      {showSettings && (
        <SettingsPage userId={userId!} onClose={() => setShowSettings(false)} />
      )}
    </main>
  );
};

export default App;
