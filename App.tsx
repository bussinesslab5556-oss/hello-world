
import React, { useState, useEffect, useCallback } from 'react';
import { AuthForm } from './packages/web/components/auth/AuthForm.tsx';
import { OtpInput } from './packages/web/components/auth/OtpInput.tsx';
import { OnboardingForm } from './packages/web/components/profile/OnboardingForm.tsx';
import { ChatWindow } from './apps/web/components/chat/ChatWindow.tsx';
import { ChatList } from './apps/web/components/ChatList.tsx';
import { SettingsPage } from './apps/web/components/chat/settings/SettingsPage.tsx';
import { WelcomeScreen } from './apps/web/components/welcome/WelcomeScreen.tsx';
import { PricingTable } from './apps/web/components/pricing/PricingTable.tsx';
import { authService } from './packages/services/auth-service.ts';
import { notificationService } from './packages/services/notification-service.ts';
import { aiModelService } from './packages/services/ai-model-service.ts';
import { getSiteUrl } from './packages/utils/env-config.ts';
import { MessageSquare, Bell, LayoutGrid, Layers, LogOut, AlertCircle, RefreshCw } from 'lucide-react';

type AppState = 'loading' | 'welcome' | 'auth' | 'otp' | 'onboarding' | 'dashboard' | 'pricing' | 'error' | 'auth-callback';
type NavTab = 'chats' | 'stories' | 'notifications';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [initProgress, setInitProgress] = useState(0);
  const [initStage, setInitStage] = useState('Synchronizing Link...');
  const [criticalError, setCriticalError] = useState<string | null>(null);
  
  const [authMode, setAuthMode] = useState<'signUp' | 'signIn'>('signUp');
  const [activeTab, setActiveTab] = useState<NavTab>('chats');
  const [userId, setUserId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string>('demo-chat');
  
  const [showSettings, setShowSettings] = useState(false);
  const detectedUrl = getSiteUrl();

  const handleSessionFound = useCallback(async (uid: string) => {
    setUserId(uid);
    try {
      // Clean URL fragment/params once session is established
      if (window.location.hash || window.location.search.includes('code=')) {
        window.history.replaceState(null, '', window.location.origin);
      }

      const isComplete = await authService.checkProfileInitialization(uid);
      setAppState(isComplete ? 'dashboard' : 'onboarding');
      notificationService.requestPermissionAndSaveToken(uid);
    } catch (err) {
      console.error('Session sync failed:', err);
      setAppState('dashboard'); 
    }
  }, []);

  useEffect(() => {
    const subscription = authService.onAuthStateChange(async (event, session) => {
      console.log(`[Neural Link] Auth Event: ${event}`);
      if (session?.user) {
        handleSessionFound(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setAppState('welcome');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSessionFound]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`[Neural Link] Site Origin: ${detectedUrl}`);
        
        // DEDICATED ROUTE: /auth/callback
        const isAuthCallback = window.location.pathname === '/auth/callback' || 
                               window.location.search.includes('code=') || 
                               window.location.hash.includes('access_token');

        if (isAuthCallback) {
          setAppState('auth-callback');
          setInitStage('Finalizing Neural Link...');
          
          // Check for PKCE code in query params
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            await authService.exchangeCodeForSession(code);
            // The onAuthStateChange listener will handle the transition once the session is set
            return;
          }
        }

        setInitStage('Loading Neural Weights...');
        await aiModelService.loadModel((p) => setInitProgress(p));

        setInitStage('Verifying Neural Signature...');
        const auth = authService.getAuthClient();
        const { data: { session } } = await auth.getSession();
        
        if (!session) {
          if (!isAuthCallback) setAppState('welcome');
          return;
        }
        
        await handleSessionFound(session.user.id);
      } catch (err: any) {
        console.error('Boot sequence interrupted:', err);
        setAppState('error');
        setCriticalError(err.message || 'Critical neural link failure.');
      }
    };
    
    initializeApp();
  }, [handleSessionFound, detectedUrl]);

  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-[#0B141A] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-[#EF4444]/10 rounded-3xl flex items-center justify-center text-[#EF4444] mb-8 border border-[#EF4444]/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <AlertCircle size={40} />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest italic mb-2">Neural Link Interrupted</h1>
        <p className="text-sm text-[#9CA3AF] font-bold uppercase tracking-widest max-w-sm mb-8 leading-relaxed">
          {criticalError}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-3 px-8 py-3 bg-[#007BFF] hover:bg-blue-600 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95"
        >
          <RefreshCw size={14} />
          Restart Neural Sync
        </button>
      </div>
    );
  }

  if (appState === 'loading' || appState === 'auth-callback') {
    return (
      <div className="min-h-screen bg-[#0B141A] flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-[#007BFF] rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="w-16 h-16 bg-[#007BFF] rounded-2xl flex items-center justify-center text-white text-3xl font-black italic relative shadow-2xl">M</div>
        </div>
        
        <div className="flex flex-col items-center gap-4 w-full max-w-[240px]">
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#007BFF] transition-all duration-300 shadow-[0_0_10px_#007BFF]" 
               style={{ width: `${initProgress}%` }}
             />
           </div>
           <span className="text-[9px] font-black text-white uppercase tracking-[0.4em] italic opacity-50 animate-pulse">
             {initStage}
           </span>
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
        onSuccess={(data) => {
          if (data?.user?.id) handleSessionFound(data.user.id);
        }} 
      />
    );
  }

  if (appState === 'otp') {
    return (
      <OtpInput 
        identifier=""
        type="email"
        onBack={() => setAppState('auth')}
        onSuccess={(data) => {
          if (data?.user?.id) handleSessionFound(data.user.id);
        }}
      />
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingForm userId={userId!} onComplete={() => setAppState('dashboard')} />;
  }

  return (
    <main className="min-h-screen bg-[#2B2F36] flex flex-col md:flex-row overflow-hidden relative">
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#1F2329] border-t border-white/5 md:relative md:h-full md:w-20 md:border-t-0 md:border-r flex md:flex-col items-center justify-between py-6 z-[100] shadow-2xl shrink-0">
        <div className="hidden md:flex flex-col items-center gap-10">
           <div className="w-10 h-10 bg-[#007BFF] rounded-xl flex items-center justify-center text-white text-lg font-black italic shadow-lg">M</div>
        </div>
        
        <div className="flex md:flex-col items-center justify-center gap-10 flex-1">
          <button onClick={() => { setActiveTab('chats'); setActiveChatId('demo-chat'); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chats' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <MessageSquare size={24} strokeWidth={2.5} />
          </button>
          <button onClick={() => setActiveTab('stories')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stories' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <Layers size={24} strokeWidth={2.5} />
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'notifications' ? 'text-[#007BFF]' : 'text-white/30 hover:text-white'}`}>
            <Bell size={24} strokeWidth={2.5} />
          </button>
          <button onClick={() => setShowSettings(true)} className="text-white/30 hover:text-white transition-all hover:rotate-90">
            <LayoutGrid size={24} />
          </button>
        </div>

        <button onClick={() => authService.signOut()} className="hidden md:block text-white/20 hover:text-[#EF4444] transition-colors">
          <LogOut size={22} />
        </button>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row h-screen transition-all duration-700 pb-16 md:pb-0 min-w-0">
        <div className={`w-full md:w-80 lg:w-96 flex-none ${activeChatId && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
          <ChatList 
            userId={userId!} 
            activeChatId={activeChatId}
            onChatSelect={(id) => setActiveChatId(id)}
            onProfileClick={() => setShowSettings(true)}
          />
        </div>

        <section className={`flex-1 relative flex flex-col bg-[#2B2F36] min-w-0 ${!activeChatId && window.innerWidth < 768 ? 'hidden' : 'flex'}`}>
          {activeChatId ? (
            <ChatWindow 
              chatId={activeChatId} 
              currentUserId={userId!} 
              recipientName={activeChatId === 'demo-chat' ? 'Neural Agent' : 'Contact'} 
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-12 opacity-30 select-none">
               <div className="w-32 h-32 rounded-[40px] bg-white/5 border border-white/5 flex items-center justify-center mb-8 shadow-inner">
                  <MessageSquare size={48} className="text-white" strokeWidth={1} />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-widest italic mb-2">Initialize Frequency</h3>
               <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest max-w-[240px]">Select a conversation to begin end-to-end encrypted neural sync.</p>
            </div>
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
