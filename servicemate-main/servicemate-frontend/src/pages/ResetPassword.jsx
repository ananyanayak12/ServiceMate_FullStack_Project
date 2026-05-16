import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [form, setForm] = useState({ p1: '', p2: '' });

  const handleReset = async (e) => {
    e.preventDefault();
    if (form.p1 !== form.p2) return toast.error("Passwords do not match!");
    
    try {
      await axios.post('http://localhost:8080/api/auth/reset-password', { 
        email: email, 
        password: form.p1 
      });
      toast.success("Password Updated Successfully!");
      navigate('/login');
    } catch (err) {
      toast.error("Failed to update database.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <form onSubmit={handleReset} className="bg-slate-900 border border-slate-800 p-10 rounded-3xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
             <ShieldCheck className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">New Password</h2>
          <p className="text-slate-400 text-sm">Update security for {email}</p>
        </div>
        <div className="space-y-4 mb-8">
          <input type="password" placeholder="New Password" required className="premium-input" onChange={e => setForm({...form, p1: e.target.value})} />
          <input type="password" placeholder="Confirm New Password" required className="premium-input" onChange={e => setForm({...form, p2: e.target.value})} />
        </div>
        <button type="submit" className="btn-glow w-full">Update Password <ArrowRight /></button>
      </form>
    </div>
  );
};
export default ResetPassword;