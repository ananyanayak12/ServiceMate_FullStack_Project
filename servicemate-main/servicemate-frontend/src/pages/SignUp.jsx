import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  ArrowRight,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LiveBackground from '../components/LiveBackground';
import AuthLayout from '../components/AuthLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [timer, setTimer] = useState(0);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    serviceType: '',
  });

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGoogleSync = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setForm((current) => ({
        ...current,
        name: decoded.name,
        email: decoded.email,
        password: '',
      }));
      setIsVerified(true);
      toast.success('Details synced! Please set your phone number and password.');
    } catch {
      toast.error('Google Sync failed');
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setForm({ ...form, phone: value });
    }
  };

  const handleSendOtp = async () => {
    if (!form.email.includes('@')) return toast.error('Invalid email');
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/signup-otp', { email: form.email });
      setOtpSent(true);
      setTimer(60);
      toast.success('OTP Sent!');
    } catch (err) {
      toast.error(err.response?.data || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', {
        email: form.email,
        otp: enteredOtp,
      });
      setIsVerified(true);
      toast.success('Verified!');
    } catch {
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone.length !== 10) return toast.error('Phone must be 10 digits');
    if (!form.password) return toast.error('Please set a password');
    if (form.role === 'provider' && !form.serviceType) {
      return toast.error('Please select a specialty');
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:8080/api/auth/signup', form);
      toast.success('Registration Successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LiveBackground>
      <AuthLayout
        eyebrow="Sign Up"
        title="Join ServiceMate"
        subtitle="Create your account in a few simple steps."
      >
        <div className="theme-panel flex justify-center rounded-3xl px-3 py-4">
          <GoogleLogin
            onSuccess={handleGoogleSync}
            onError={() => toast.error('Google Sync Failed')}
            text="signup_with"
            shape="pill"
            theme="filled_blue"
          />
        </div>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 rounded-[1.6rem] border border-[var(--hero-card-border)] bg-[var(--surface-muted)] p-2 sm:grid-cols-2">
            {['customer', 'provider'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`rounded-2xl px-4 py-3 text-sm font-bold capitalize transition-all ${
                  form.role === r
                    ? 'text-[var(--primary-contrast)] shadow-[0_16px_40px_rgba(79,212,235,0.18)]'
                    : 'text-[var(--text-muted)] hover:opacity-80'
                }`}
                style={form.role === r ? { backgroundColor: 'var(--primary-accent)' } : undefined}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="premium-input-wrapper group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
            <input
              className="premium-input"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="premium-input-wrapper group relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
            <input
              className="premium-input pr-28"
              type="email"
              placeholder="Email address"
              value={form.email}
              disabled={isVerified}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            {!isVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={timer > 0 || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-bold text-[var(--primary-contrast)] transition-opacity disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary-accent)' }}
              >
                {timer > 0 ? `${timer}s` : 'Send OTP'}
              </button>
            )}
            {isVerified && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />}
          </div>

          <AnimatePresence>
            {otpSent && !isVerified && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    className="premium-input text-center font-bold tracking-[0.45em]"
                    placeholder="6-digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="theme-button-primary rounded-2xl px-6 py-4 text-sm font-bold transition-colors hover:opacity-90"
                  >
                    Verify
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {form.role === 'provider' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="premium-input-wrapper group relative overflow-hidden"
              >
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
                <select
                  className="premium-input pr-10"
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  required={form.role === 'provider'}
                  value={form.serviceType}
                >
                 <option value="" disabled>Select specialty</option>
                 <option value="AC Service">AC Service</option>
                 <option value="Appliance Repair">Appliance Repair</option>
                 <option value="Carpentry">Carpentry</option>
                 <option value="Deep Cleaning">Deep Cleaning</option>
                 <option value="Electrical">Electrical</option>
                 <option value="Home Safety">Home Safety</option>
                 <option value="Pest Control">Pest Control</option>
                 <option value="Plumbing">Plumbing</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="premium-input-wrapper group relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
            <span className="absolute left-12 top-1/2 -translate-y-1/2 border-r border-[var(--border-soft)] pr-2 font-bold text-[var(--text-muted)]">+91</span>
            <input
              className="premium-input pl-24"
              placeholder="Mobile number"
              value={form.phone}
              onChange={handlePhoneChange}
              required
            />
          </div>

          <div className="premium-input-wrapper group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
            <input
              className="premium-input"
              type="password"
              placeholder="Create password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={!isVerified || loading} className="btn-glow mt-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Register Account <ArrowRight size={20} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-75">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    </LiveBackground>
  );
};

export default SignUp;
