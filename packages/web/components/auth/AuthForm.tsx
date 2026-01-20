
import React, { useState, useEffect } from 'react';
import { authService } from '../../../../packages/services/auth-service.ts';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

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
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Email Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Phone Form State
  const [phone, setPhone] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isFormValid = method === 'email' 
    ? (isEmailValid && isPasswordValid && (mode === 'signIn' || agreeToTerms))
    : (phone.length >= 8);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    try {
      if (mode === 'signUp') {
        const data = await authService.signUpWithEmail(email, password);
        onSuccess?.(data);
      } else {
        const data = await authService.signInWithEmail(email, password);
        onSuccess?.(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      await authService.sendOtp(formattedPhone);
      onSuccess?.({ phone: formattedPhone, step: 'otp' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'azure') => {
    setLoading(true);
    try {
      await authService.signInWithSocial(provider as any);
    } catch (err: any) {
      setError("Authorization canceled");
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
            aria-label="Back"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Toggle Tabs */}
          <div className="flex border-b border-gray-100 relative">
            <button 
              onClick={() => setMode('signUp')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'signUp' ? 'text-[#007BFF]' : 'text-[#9CA3AF]'}`}
            >
              Sign Up
            </button>
            <button 
              onClick={() => setMode('signIn')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'signIn' ? 'text-[#007BFF]' : 'text-[#9CA3AF]'}`}
            >
              Sign In
            </button>
            <div 
              className="absolute bottom-0 h-[2px] bg-[#007BFF] transition-all duration-300" 
              style={{ width: '50%', left: mode === 'signUp' ? '0%' : '50%' }}
            />
          </div>

          <div className="mt-2">
            <h1 className="text-[24px] font-bold text-[#1F2937]">
              {mode === 'signUp' ? 'Create Account' : 'Welcome Back'}
            </h1>
          </div>
        </div>

        {/* Auth Method Toggle */}
        <div className="px-6 mt-6 flex gap-2">
          <button 
            onClick={() => setMethod('email')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${method === 'email' ? 'bg-[#007BFF] border-[#007BFF] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 border-gray-200 text-[#9CA3AF]'}`}
          >
            Email
          </button>
          <button 
            onClick={() => setMethod('phone')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${method === 'phone' ? 'bg-[#007BFF] border-[#007BFF] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 border-gray-200 text-[#9CA3AF]'}`}
          >
            Phone
          </button>
        </div>

        {/* Forms */}
        <div className="flex-1 px-6 py-8">
          {method === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="work@example.com"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/10 outline-none transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  autoComplete="email"
                />
                {email && !isEmailValid && <p className="text-[#EF4444] text-[12px]">Enter a valid email address</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8+ characters"
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 focus:border-[#007BFF] focus:ring-2 focus:ring-[#007BFF]/10 outline-none transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
                {mode === 'signUp' && password && !isPasswordValid && <p className="text-[#EF4444] text-[12px]">Use 8+ characters with numbers</p>}
              </div>

              {mode === 'signUp' && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreeToTerms ? 'bg-[#007BFF] border-[#007BFF]' : 'border-gray-300 bg-white group-hover:border-[#007BFF]'}`}>
                    {agreeToTerms && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={agreeToTerms} 
                      onChange={(e) => setAgreeToTerms(e.target.checked)} 
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">I agree to Terms & Privacy Policy</span>
                </label>
              )}

              {error && <p className="text-[#EF4444] text-xs font-semibold">{error}</p>}

              <button 
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 bg-[#007BFF] disabled:bg-gray-200 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {loading ? 'Processing...' : 'Continue with Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">Mobile Number</label>
                <div className="flex h-12 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#007BFF] focus-within:ring-2 focus-within:ring-[#007BFF]/10 transition-all">
                  <div className="px-4 bg-gray-50 border-r border-gray-200 flex items-center gap-2">
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-sm font-bold text-[#1F2937]">+1</span>
                  </div>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder="555 000 0000"
                    className="flex-1 px-4 text-sm text-[#1F2937] outline-none bg-white placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              {error && <p className="text-[#EF4444] text-xs font-semibold">{error}</p>}

              <button 
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 bg-[#007BFF] disabled:bg-gray-200 text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {/* Social Auth */}
          <div className="mt-10 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative bg-[#FFFFFF] px-4 text-[14px] text-[#9CA3AF] font-medium">Or continue with</span>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleSocialAuth('google')}
                className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center px-6 gap-4 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-sm font-bold text-[#1F2937]">Continue with Google</span>
              </button>

              <button 
                onClick={() => handleSocialAuth('azure')}
                className="w-full h-12 bg-white border border-gray-200 rounded-xl flex items-center px-6 gap-4 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 23 23" className="w-5 h-5">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                <span className="text-sm font-bold text-[#1F2937]">Continue with Microsoft</span>
              </button>

              <button 
                onClick={() => handleSocialAuth('apple')}
                className="w-full h-12 bg-black rounded-xl flex items-center px-6 gap-4 hover:bg-gray-900 transition-colors shadow-lg"
              >
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.78 1.02-.1 2.11-.84 3.39-.73 1.57.14 2.72.76 3.38 1.76-3.24 1.95-2.71 6.13.51 7.46-.66 1.63-1.57 3.23-2.39 3.7zM12.03 7.25c-.02-3.99 3.34-7.21 7.21-7.1 0 4.28-3.41 7.46-7.21 7.1z"/></svg>
                <span className="text-sm font-bold text-white">Continue with Apple</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-10 mt-auto">
          <p className="text-[12px] text-[#9CA3AF] text-center leading-relaxed font-medium">
            By continuing, you agree to our <br />
            <span className="text-[#007BFF] cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#007BFF] cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};
