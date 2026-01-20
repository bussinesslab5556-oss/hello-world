import React, { useState, useRef, useEffect } from 'react';
import { authService } from '../../../../packages/services/auth-service.ts';
import { ChevronLeft } from 'lucide-react';

interface OtpInputProps {
  identifier: string;
  type: 'email' | 'phone';
  onSuccess: (data: any) => void;
  onBack: () => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ identifier, type, onSuccess, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Improved masking logic
  const maskedIdentifier = type === 'email' 
    ? identifier.replace(/(.{3})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + gp3.replace(/./g, '*'))
    : identifier.replace(/^(.*)(.{4})$/, (_, p1, p2) => p1.replace(/./g, '*') + p2);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInputChange = (value: string, index: number) => {
    const digit = value.slice(-1);
    if (isNaN(Number(digit)) && digit !== '') return;
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.verifyOtp(identifier, code, type);
      onSuccess(data);
    } catch (err: any) {
      setIsShake(true);
      setError(err.message || "Invalid code. Try again.");
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setTimeout(() => setIsShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resendDisabled) return;
    
    if (resendAttempts >= 5) {
      setResendDisabled(true);
      setError("Too many attempts. Please wait.");
      return;
    }

    try {
      await authService.sendOtp(identifier, type);
      setTimer(60);
      setResendAttempts(prev => prev + 1);
      setError(null);
    } catch (err: any) {
      setError('Connection lost. Retry?');
    }
  };

  const isFormFilled = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] flex flex-col items-center">
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

          <div className="mt-2">
            <h1 className="text-[24px] font-bold text-[#1F2937]">Check Your {type === 'email' ? 'Inbox' : 'Messages'}</h1>
            <p className="text-[14px] text-[#9CA3AF] mt-1 font-medium leading-relaxed">
              We sent a 6-digit code to <span className="text-[#1F2937] font-bold">{maskedIdentifier}</span>
            </p>
          </div>
        </div>

        {/* OTP Input Boxes */}
        <div className={`px-6 py-10 flex justify-between gap-2 md:gap-3 ${isShake ? 'animate-shake' : ''}`}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              aria-label={`Digit ${i + 1} of 6`}
              onChange={(e) => handleInputChange(e.target.value, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              autoFocus={i === 0}
              className={`
                w-full h-[56px] md:h-[64px] text-center text-2xl font-bold rounded-xl outline-none transition-all duration-300
                ${digit !== '' ? 'border-2 border-[#39FF14]' : 'border border-[#E5E7EB]'}
                focus:border-2 focus:border-[#007BFF] text-[#1F2937] bg-white shadow-sm
              `}
            />
          ))}
        </div>

        {/* Resend Section */}
        <div className="px-6 text-center">
          {timer > 0 ? (
            <p className="text-sm font-bold text-[#9CA3AF] uppercase tracking-widest text-[10px]">Resend in 0:{timer.toString().padStart(2, '0')}</p>
          ) : (
            <p className="text-sm font-medium text-[#9CA3AF]">
              Didn't receive it?{' '}
              <button 
                onClick={handleResend}
                disabled={resendDisabled}
                className="text-[#007BFF] font-bold hover:underline transition-all"
              >
                Resend Code
              </button>
            </p>
          )}
        </div>

        {/* Error */}
        <div className="px-6 h-10 mt-4">
           {error && <p className="text-[#EF4444] text-xs font-semibold text-center animate-in fade-in">{error}</p>}
        </div>

        {/* Verify Button */}
        <div className="px-6 pb-12 mt-auto">
          <button 
            onClick={() => handleVerify(otp.join(''))}
            disabled={!isFormFilled || loading}
            className="w-full h-12 bg-[#007BFF] disabled:bg-[#E5E7EB] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </div>

      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.1s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};
