
import React, { useState } from 'react';
import { authService, AuthError } from '../../../../packages/services/auth-service.ts';
import { ChevronLeft, AlertCircle, CheckCircle2, Mail, Loader2, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  initialMode?: 'signUp' | 'signIn';
  onBack?: () => void;
  onSuccess?: (data: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  initialMode = 'signUp', 
  onBack,
  onSuccess 
}) => {
  const [mode, setMode] = useState<'signUp' | 'signIn'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordFlowValid = isEmailValid && password.length >= 6 && (mode === 'signIn' || agreeToTerms);

  const toggleMode = () => {
    setMode(mode === 'signUp' ? 'signIn' : 'signUp');
    setError(null);
    setSuccessMsg(null);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordFlowValid) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signIn') {
        const data = await authService.signInWithPassword(email.trim(), password);
        onSuccess?.(data);
      } else {
        const data = await authService.signUp(email.trim(), password);
        
        // Handle Supabase "Email Confirmation Enabled" flow
        if (data.user && !data.session) {
          setSuccessMsg(`Neural link initialized. Please check ${email.trim().toLowerCase()} for your verification signature.`);
          setLoading(false);
        } else {
          onSuccess?.(data);
        }
      }
    } catch (err: any) {
      setError({ message: err.message, code: err.code });
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!isEmailValid) return;
    setLoading(true);
    try {
      await authService.resendConfirmation(email.trim());
      setSuccessMsg(`New verification link sent to ${email.trim().toLowerCase()}.`);
      setError(null);
    } catch (err: any) {
      setError({ message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] md:bg-transparent flex flex-col items-center">
      <div className="w-full max-w-[420px] bg-[#FFFFFF] min-h-screen md:min-h-0 md:rounded-[32px] md:shadow-xl md:my-12 flex flex-col relative overflow-hidden animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="px-6 pt-6 flex flex-col gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-[#1F2937] hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex border-b border-gray-100 relative">
            <button onClick={() => setMode('signUp')} className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${mode === 'signUp' ? 'text-[#007BFF]' : 'text-[#9CA3AF]'}`}>Sign Up</button>
            <button onClick={() => setMode('signIn')} className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-colors ${mode === 'signIn' ? 'text-[#007BFF]' : 'text-[#9CA3AF]'}`}>Log In</button>
            <div className="absolute bottom-0 h-[2.5px] bg-[#007BFF] transition-all duration-300 rounded-full" style={{ width: '50%', left: mode === 'signUp' ? '0%' : '50%' }} />
          </div>

          <div className="mt-2">
            <h1 className="text-[24px] font-bold text-[#1F2937] tracking-tight">{mode === 'signUp' ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-sm text-[#9CA3AF] mt-1 font-medium">{mode === 'signUp' ? 'Join our secure neural network' : 'Securely access your conversations'}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 px-6 py-8">
          <form onSubmit={handleAction} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#007BFF] outline-none transition-all text-[#1F2937]"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Password</label>
                {mode === 'signIn' && (
                  <button type="button" className="text-[10px] font-black text-[#007BFF] uppercase tracking-widest hover:underline">Forgot?</button>
                )}
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#007BFF] outline-none transition-all text-[#1F2937]"
                autoComplete={mode === 'signIn' ? "current-password" : "new-password"}
                disabled={loading}
                required
              />
            </div>

            {mode === 'signUp' && (
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreeToTerms ? 'bg-[#007BFF] border-[#007BFF]' : 'border-gray-300 bg-white group-hover:border-[#007BFF]'}`}>
                  {agreeToTerms && <CheckCircle2 className="w-4 h-4 text-white" />}
                  <input type="checkbox" className="hidden" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} />
                </div>
                <span className="text-xs text-gray-500 font-medium">I agree to the Terms and Privacy Policy</span>
              </label>
            )}

            {/* ERROR DISPLAY */}
            {error && (
              <div className="flex flex-col gap-3 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-[#EF4444] leading-relaxed uppercase tracking-tight">{error.message}</p>
                </div>
                
                {error.code === 'EMAIL_NOT_CONFIRMED' && (
                  <button 
                    type="button"
                    onClick={handleResendConfirmation}
                    className="flex items-center gap-2 text-[10px] font-black text-[#007BFF] uppercase tracking-widest pl-8 hover:underline"
                  >
                    <Mail size={12} /> Resend Verification
                  </button>
                )}
              </div>
            )}

            {/* SUCCESS DISPLAY */}
            {successMsg && (
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-1">
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-[#10B981] leading-relaxed uppercase tracking-tight italic">{successMsg}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading || !isPasswordFlowValid}
              className="w-full h-12 bg-[#007BFF] disabled:bg-gray-200 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Establishing Link...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signIn' ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-6 py-8 border-t border-gray-50 mt-auto flex flex-col items-center gap-4">
           <button onClick={toggleMode} className="text-sm font-bold text-[#007BFF] hover:underline">
             {mode === 'signUp' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
           </button>
        </div>
      </div>
    </div>
  );
};
