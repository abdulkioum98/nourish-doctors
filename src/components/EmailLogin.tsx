import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

interface EmailLoginProps {
  onLoginSuccess: () => void;
}

export default function EmailLogin({ onLoginSuccess }: EmailLoginProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ১. ইমেইল চেক ও OTP পাঠানো
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const formattedEmail = email.trim().toLowerCase();

    try {
      // Step A: .maybeSingle() ব্যবহার করা হয়েছে যেন ইমেইল না মিললেও PGRST116 এরর না দেয়
      const { data: allowed, error: dbError } = await supabase
        .from('allowed_emails')
        .select('email')
        .eq('email', formattedEmail)
        .maybeSingle();

      if (dbError) {
        setErrorMsg('Database error. Please try again.');
        setLoading(false);
        return;
      }

      // যদি টেবিলে ইমেইল না পাওয়া যায়
      if (!allowed) {
        setErrorMsg('This email is not authorized to access this app.');
        setLoading(false);
        return;
      }

      // Step B: Supabase-এর মাধ্যমে ইমেইলে OTP পাঠানো
      const { error } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setStep('otp');
      }
    } catch (err) {
      setErrorMsg('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  // ২. OTP ভেরিফাই করা
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    });

    if (error) {
      setErrorMsg('Invalid Code! Please check your email and try again.');
      setLoading(false);
    } else if (data.session) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-xs">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Email Verification</h2>
          <p className="text-slate-500 text-[11px]">
            {step === 'email' ? 'Enter your authorized email address' : `Enter 6-digit code sent to ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-center font-medium">
            {errorMsg}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium text-slate-800"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <span>Send OTP Code</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Enter 6-digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700 font-bold tracking-widest text-center text-slate-800"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center space-x-1"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <span>Verify & Login</span>}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-slate-500 hover:underline text-[11px] text-center block pt-1"
            >
              Change Email Address
            </button>
          </form>
        )}
      </div>
    </div>
  );
}