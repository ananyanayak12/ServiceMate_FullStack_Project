import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import LiveBackground from '../components/LiveBackground';
import axios from 'axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Endpoint to trigger OTP email from Backend
      await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
      toast.success("OTP sent to your email!");
      // Navigate to OTP verification page (passing email in state)
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LiveBackground>
      <div className="flex min-h-screen items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl p-10 rounded-3xl border border-slate-800 shadow-2xl"
        >
          <div className="mb-8">
            <Link to="/login" className="text-slate-500 hover:text-white flex items-center gap-2 mb-6 transition-colors">
              <ChevronLeft size={20} /> Back to Login
            </Link>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-slate-400">Enter your email to receive a 6-digit OTP.</p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="premium-input-wrapper group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-indigo-400" size={20} />
              <input 
                className="premium-input" 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="btn-glow w-full">
              {loading ? "Sending..." : "Send OTP"} <ArrowRight size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    </LiveBackground>
  );
};

export default ForgotPassword;