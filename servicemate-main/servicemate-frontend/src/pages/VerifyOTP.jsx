import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Timer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import LiveBackground from '../components/LiveBackground';
import AuthLayout from '../components/AuthLayout';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (timeLeft === 0) return toast.error('OTP Expired!');

    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', { email, otp: otp.join('') });
      toast.success('Verified!');
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error('Invalid OTP');
    }
  };

  return (
    <LiveBackground>
      <AuthLayout
        eyebrow="Security Check"
        title="Verify OTP"
        subtitle={`Enter the 6-digit code sent to ${email || 'your email address'}.`}
      >
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="theme-panel flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--text-secondary)]">
            <Timer size={18} className={timeLeft < 10 ? 'text-rose-500' : 'text-sky-500'} />
            <span className="font-semibold">Expires in: 00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
          </div>

          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => {
                  const nextOtp = [...otp];
                  nextOtp[index] = e.target.value.replace(/\D/g, '').slice(-1);
                  setOtp(nextOtp);
                  if (nextOtp[index] && index < otp.length - 1) inputRefs.current[index + 1]?.focus();
                }}
                className="h-14 w-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] text-center text-xl font-bold text-[var(--text-primary)] outline-none transition focus:border-sky-400"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={timeLeft === 0}
            className="theme-button-primary flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold disabled:opacity-60"
          >
            Submit OTP <ArrowRight size={18} />
          </button>
        </form>
      </AuthLayout>
    </LiveBackground>
  );
};

export default VerifyOTP;
