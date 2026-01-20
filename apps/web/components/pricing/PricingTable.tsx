
import React from 'react';
import { PlanTier, SUBSCRIPTION_LIMITS } from '../../../../packages/utils/constants.ts';

const PRICING_DATA = [
  {
    tier: PlanTier.FREE,
    price: '$0',
    description: 'Entry-level networking',
    features: [
      `${(SUBSCRIPTION_LIMITS[PlanTier.FREE].translation_limit / 1000000).toFixed(0)}M Translation Chars`,
      `${SUBSCRIPTION_LIMITS[PlanTier.FREE].call_minutes_limit} Min AI Calls`,
      `${SUBSCRIPTION_LIMITS[PlanTier.FREE].storage_limit_mb}MB Secure Storage`,
      'Standard Support'
    ],
    highlight: false
  },
  {
    tier: PlanTier.PREMIUM,
    price: '$9.99',
    description: 'Professional grade sync',
    features: [
      `${(SUBSCRIPTION_LIMITS[PlanTier.PREMIUM].translation_limit / 1000000).toFixed(0)}M Translation Chars`,
      `${SUBSCRIPTION_LIMITS[PlanTier.PREMIUM].call_minutes_limit} Min AI Calls`,
      `${(SUBSCRIPTION_LIMITS[PlanTier.PREMIUM].storage_limit_mb / 1024).toFixed(0)}GB Secure Storage`,
      'Priority Neural Processing',
      'Advanced Tone Control'
    ],
    highlight: true,
    badge: 'Most Popular'
  },
  {
    tier: PlanTier.PRO,
    price: '$29.99',
    description: 'Unlimited creative flow',
    features: [
      'Unlimited Translation',
      'Unlimited AI Calls',
      `${(SUBSCRIPTION_LIMITS[PlanTier.PRO].storage_limit_mb / 1024).toFixed(0)}GB Cloudflare R2`,
      'Custom Industry Modes',
      '24/7 Priority Support'
    ],
    highlight: false
  },
  {
    tier: PlanTier.BUSINESS,
    price: '$99.99',
    description: 'Enterprise scale intelligence',
    features: [
      'Unlimited + Advanced Analytics',
      'Unlimited Voice Nodes',
      '100GB Dedicated Storage',
      'Custom LLM Integration',
      'White-label Capability'
    ],
    highlight: false
  }
];

const PricingCard: React.FC<{ data: typeof PRICING_DATA[0] }> = ({ data }) => {
  const isPremium = data.highlight;

  return (
    <div className={`relative group transition-all duration-500 hover:-translate-y-2 ${isPremium ? 'z-10' : 'z-0'}`}>
      {/* Background Glow for Premium */}
      {isPremium && (
        <div className="absolute -inset-0.5 bg-gradient-to-b from-[#39FF14] to-[#007BFF] rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      )}

      <div className={`relative h-full flex flex-col bg-[#1F2329]/90 backdrop-blur-3xl rounded-[32px] border ${isPremium ? 'border-[#39FF14]/50 shadow-[0_20px_50px_rgba(57,255,20,0.1)]' : 'border-[#3A3F47]'} overflow-hidden p-8`}>
        {data.badge && (
          <div className="absolute top-6 right-8 px-3 py-1 bg-[#39FF14] rounded-full text-[10px] font-black text-black uppercase tracking-widest animate-pulse">
            {data.badge}
          </div>
        )}

        <div className="mb-8">
          <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-2 ${isPremium ? 'text-[#39FF14]' : 'text-[#9CA3AF]'}`}>
            {data.tier}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tracking-tighter italic">{data.price}</span>
            <span className="text-xs text-[#9CA3AF] font-bold">/month</span>
          </div>
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mt-2">{data.description}</p>
        </div>

        <div className="flex-1 space-y-4 mb-10">
          {data.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-[#39FF14] shadow-[0_0_8px_#39FF14]' : 'bg-[#007BFF]'}`}></div>
              <span className="text-xs font-bold text-gray-300 leading-tight">{feature}</span>
            </div>
          ))}
        </div>

        <button className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 ${
          isPremium 
            ? 'bg-[#39FF14] text-black hover:bg-[#32e012] shadow-[0_10px_30px_rgba(57,255,20,0.2)]' 
            : 'bg-[#007BFF] text-white hover:bg-blue-600 shadow-[0_10px_30px_rgba(0,123,255,0.2)]'
        }`}>
          Select {data.tier}
        </button>
      </div>
    </div>
  );
};

export const PricingTable: React.FC = () => {
  return (
    <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRICING_DATA.map((plan) => (
          <PricingCard key={plan.tier} data={plan} />
        ))}
      </div>
      
      <div className="mt-16 p-8 bg-[#1F2329]/50 border border-[#3A3F47] rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">Enterprise Security Guaranteed</h4>
            <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest mt-1">SSL Encrypted • Global RLS • SOC2 Readiness</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-[#2B2F36] rounded-xl border border-[#3A3F47] text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">
             PCI Compliant
           </div>
           <div className="px-6 py-3 bg-[#2B2F36] rounded-xl border border-[#3A3F47] text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">
             256-bit AES
           </div>
        </div>
      </div>
    </div>
  );
};
