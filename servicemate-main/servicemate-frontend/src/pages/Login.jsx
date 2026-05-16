import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LiveBackground from '../components/LiveBackground';
import AuthLayout from '../components/AuthLayout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const getAvailabilityKey = (user) => `provider-availability:${user.id ?? user.email ?? 'unknown'}`;

  const persistUserSession = (userPayload, token) => {
    const persistedAvailability = localStorage.getItem(getAvailabilityKey(userPayload));
    const nextUser = {
      ...userPayload,
      availability:
        userPayload.role === 'provider'
          ? (
            typeof userPayload.availability === 'boolean'
              ? userPayload.availability
              : persistedAvailability === null
                ? true
                : persistedAvailability === 'true'
          )
          : userPayload.availability,
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    if (nextUser.role === 'provider') {
      localStorage.setItem(getAvailabilityKey(nextUser), String(nextUser.availability));
    }
    return nextUser;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', form);
      const user = persistUserSession(res.data.user, res.data.token);
      toast.success("Welcome Back!");
      // Navigate based on role saved in DB
      navigate(user.role === 'provider' ? '/provider-dashboard' : '/customer-dashboard');
    } catch (err) {
      toast.error(err.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    try {
      const res = await axios.post('http://localhost:8080/api/auth/google-login', {
        email: decoded.email
      });

      const user = persistUserSession(res.data.user, res.data.token);

      toast.success(`Welcome back, ${user.name}`);
      navigate(user.role === 'provider' ? '/provider-dashboard' : '/customer-dashboard');
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Account not found. Please sign up first!");
        setTimeout(() => navigate('/signup'), 2000);
      } else {
        toast.error("Google Login failed. Please try again.");
      }
    }
  };

  return (
    <LiveBackground>
      <AuthLayout
        eyebrow="Log In"
        title="Welcome back"
        subtitle="Sign in to continue to your ServiceMate account."
      >
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="premium-input-wrapper group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
            <input
              className="premium-input"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="premium-input-wrapper group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-[var(--primary-accent-strong)]" size={20} />
              <input
                className="premium-input"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">Use your registered email and password.</span>
              <Link to="/forgot-password" className="font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-75">
                Forgot password?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-glow">
            {loading ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
        </div>

        <div className="theme-panel flex justify-center rounded-3xl px-3 py-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("Google Login Failed")}
            theme="filled_blue"
            shape="pill"
            width="340"
          />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          New to ServiceMate?{' '}
          <Link to="/signup" className="font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-75">
            Create account
          </Link>
        </p>
      </AuthLayout>
    </LiveBackground>
  );
};

export default Login;
