import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Bell, CalendarDays, DollarSign, LoaderCircle, LogOut, Mail, MapPin, MessageSquare,
  PencilLine, Phone, Save, Settings, ShieldCheck, Sparkles, Star, ToggleLeft,
  ToggleRight, UserCircle2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import LiveBackground from '../components/LiveBackground';
import { LayoutDashboard, Briefcase, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useNotifications } from '../hooks/useNotifications';

const labels = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  carpentry: 'Carpentry',
  'deep cleaning': 'Deep Cleaning',
  'appliance repair': 'Appliance Repair',
  'pest control': 'Pest Control',
  'ac service': 'AC Service',
  'home safety': 'Home Safety',
};

const reviews = [
  ['Jessica Brown', '2026-03-28', 5, 'Excellent service! Very professional and thorough.'],
  ['David Miller', '2026-03-27', 4, 'Good work, arrived on time.'],
  ['Lisa Anderson', '2026-03-26', 5, 'Outstanding quality and attention to detail.'],
];

const statusClass = {
  PENDING: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  CONFIRMED: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  COMPLETED: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  CANCELLED: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
};



const formatDate = (value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
    value ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(`${value}T00:00:00`)) : 'Date not provided';

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const availabilityKey = `provider-availability:${storedUser.id ?? storedUser.email ?? 'unknown'}`;
  const persistedAvailability = localStorage.getItem(availabilityKey);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [bookingTab, setBookingTab] = useState('confirmed'); // 'pending' | 'confirmed'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [providerView, setProviderView] = useState('dashboard');
  const [analyticsTab, setAnalyticsTab] = useState('thismonth'); // 'dashboard' | 'reviews' | 'performance'
  const [bellProviderOpen, setBellProviderOpen] = useState(false);
  const bellProviderRef = useRef(null);
  const [bellProviderPos, setBellProviderPos] = useState({ top: 0, right: 0 });

  const openBellProvider = () => {
    if (bellProviderRef.current) {
      const rect = bellProviderRef.current.getBoundingClientRect();
      setBellProviderPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setBellProviderOpen((o) => { if (!o) markProviderRead(); return !o; });
  };
  const [providerReviews, setProviderReviews] = useState([]);

  useEffect(() => {
    if (!storedUser?.id) return;
    api.get(`/api/reviews/provider/${storedUser.id}`)
      .then((res) => setProviderReviews(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [storedUser?.id]);
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [providerProfileOpen, setProviderProfileOpen] = useState(false);
  const providerProfileRef = useRef(null);
  const [providerProfilePos, setProviderProfilePos] = useState({ top: 0, right: 0 });

  const openProviderProfile = () => {
    if (providerProfileRef.current) {
      const rect = providerProfileRef.current.getBoundingClientRect();
      setProviderProfilePos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setProviderProfileOpen((o) => !o);
  };
  const [form, setForm] = useState({
    id: storedUser.id,
    name: storedUser.name || '',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    serviceType: storedUser.serviceType || 'electrical',
    city: storedUser.city || '',
    bio: storedUser.bio || '',
    price: storedUser.price || '',
    availability:
        typeof storedUser.availability === 'boolean'
            ? storedUser.availability
            : persistedAvailability === null
                ? true
                : persistedAvailability === 'true',
  });

  useEffect(() => {
    if (!storedUser?.id) {
      navigate('/login', { replace: true });
      return;
    }
    api.get(`/api/bookings/provider/${storedUser.id}`)
        .then((res) => {
          syncStoredUser(storedUser);
          setBookings(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => toast.error('Failed to load bookings'))
        .finally(() => setLoading(false));
  }, [navigate, storedUser?.id]);


  const metrics = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    return {
      total,
      confirmed,
      completed,
      pending,
      completion: total ? `${Math.round(((confirmed + completed) / total) * 100)}%` : '0%',
    };
  }, [bookings]);

  const { notifications: providerNotifs, unreadCount: providerUnread, markAllRead: markProviderRead, clearAll: clearProviderAll } = useNotifications(bookings, 'provider', storedUser?.id);

  const profileCompletion = useMemo(() => {
    const keys = ['name', 'email', 'phone', 'serviceType', 'city', 'bio'];
    return Math.round((keys.filter((k) => String(form[k] || '').trim()).length / keys.length) * 100);
  }, [form]);

  // 🔥 Dynamic Earnings
  const totalEarnings = useMemo(() => {
    return bookings
        .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.amount || 500), 0);
  }, [bookings]);

  const avgRating = useMemo(() => {
    if (!providerReviews.length) return 'N/A';
    const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    return avg.toFixed(1);
  }, [providerReviews]);

  const statStyles = useMemo(() => [
    [`₹ ${totalEarnings}`, 'Total Earnings', '+12%', DollarSign, 'from-emerald-300/20'],
    [null, 'Active Bookings', null, CalendarDays, 'from-cyan-300/20'],
    [avgRating, 'Avg Rating', null, Star, 'from-amber-300/20'],
    [null, 'Completion Rate', null, ShieldCheck, 'from-violet-300/20'],
  ], [totalEarnings, avgRating]);

  const statsChartData = useMemo(() => [
    { name: 'Earnings', value: totalEarnings },
    { name: 'Bookings', value: metrics.total * 100 },
    { name: 'Rating', value: avgRating === 'N/A' ? 0 : parseFloat(avgRating) * 100 },
    { name: 'Completion', value: parseInt(metrics.completion) * 10 },
  ], [totalEarnings, metrics, avgRating]);

// 📊 Monthly earnings graph
  const monthlyData = useMemo(() => {
    const map = {};

    bookings.forEach((b) => {
      if ((b.status === 'CONFIRMED' || b.status === 'COMPLETED') && b.bookingDate) {
        const month = new Date(b.bookingDate).toLocaleString('en-IN', { month: 'short' });
        map[month] = (map[month] || 0) + (b.amount || 500);
      }
    });

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    return months.map((m) => ({
      name: m,
      earnings: map[m] || 0,
    }));
  }, [bookings]);

// 🧾 Recent Activity
  const recentActivity = useMemo(() => {
    return bookings.slice(0, 5).map((b) => {
      if (b.status === 'CONFIRMED') return `✔ Booking confirmed for ${b.customerName}`;
      if (b.status === 'PENDING') return `⏳ New request from ${b.customerName}`;
      if (b.status === 'CANCELLED') return `❌ Booking cancelled`;
      return 'Activity updated';
    });
  }, [bookings]);

// 💡 Smart Tip
  const smartInsight = useMemo(() => {
    let type = 'success';
    let message = 'Great performance! 🚀';
    let action = 'Keep delivering excellent service';

    if (metrics.pending > 3) {
      type = 'warning';
      message = `You have ${metrics.pending} pending requests`;
      action = 'Respond faster to avoid losing customers';
    } else if (metrics.confirmed < metrics.total / 2 && metrics.total > 0) {
      type = 'danger';
      message = 'Low booking conversion rate';
      action = 'Improve response time & communication';
    } else if (profileCompletion < 80) {
      type = 'info';
      message = `Profile only ${profileCompletion}% complete`;
      action = 'Complete profile to gain more trust';
    } else if (totalEarnings > 5000) {
      type = 'success';
      message = `₹${totalEarnings} earned this period`;
      action = 'You are performing above average!';
    }

    return { type, message, action };
  }, [metrics, profileCompletion, totalEarnings]);

// 📅 Today Summary
  const todayStats = useMemo(() => {
    const today = new Date();

    const todayBookings = bookings.filter((b) => {
      if (!b.bookingDate) return false;

      const date = new Date(b.bookingDate);

      return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
      );
    });

    return {
      total: todayBookings.length,
      confirmed: todayBookings.filter(b => b.status === 'CONFIRMED').length,
      pending: todayBookings.filter(b => b.status === 'PENDING').length,
    };
  }, [bookings]);

  const avgResponseTime = useMemo(() => {
    if (!bookings.length) return 'N/A';
    return `${Math.max(5, 15 - metrics.pending * 2)} mins`;
  }, [bookings, metrics]);

  const syncStoredUser = (user, overrides = {}) => {
    const nextUser = {
      ...storedUser,
      ...user,
      ...overrides,
    };
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem(
        availabilityKey,
        String(typeof nextUser.availability === 'boolean' ? nextUser.availability : true),
    );
    setForm((current) => ({
      ...current,
      id: nextUser.id,
      name: nextUser.name || '',
      email: nextUser.email || '',
      phone: nextUser.phone || '',
      serviceType: nextUser.serviceType || 'electrical',
      city: nextUser.city || '',
      bio: nextUser.bio || '',
      price: nextUser.price || '',
      availability:
          typeof nextUser.availability === 'boolean'
              ? nextUser.availability
              : persistedAvailability === null
                  ? true
                  : persistedAvailability === 'true',
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.city.trim()) return toast.error('City is required');
    if (form.phone.length !== 10) return toast.error('Phone must be 10 digits');
    setSaving(true);
    try {
      const res = await api.put('/api/auth/profile', {
        id: form.id, name: form.name.trim(), phone: form.phone,
        serviceType: form.serviceType, city: form.city.trim(), bio: form.bio.trim(),
        price: form.price ? Number(form.price) : null,
        availability: form.availability,
      });
      syncStoredUser(res.data.user);
      setEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    const nextAvailability = !form.availability;
    setAvailabilitySaving(true);
    setForm((current) => ({ ...current, availability: nextAvailability }));
    try {
      const res = await api.put('/api/auth/profile', {
        id: form.id,
        name: form.name.trim(),
        phone: form.phone,
        serviceType: form.serviceType,
        city: form.city.trim(),
        bio: form.bio.trim(),
        availability: nextAvailability,
      });
      syncStoredUser(res.data.user, { availability: nextAvailability });
      toast.success(nextAvailability ? 'You are visible for new jobs' : 'You are now offline');
    } catch (error) {
      setForm((current) => ({ ...current, availability: !nextAvailability }));
      toast.error(error.response?.data || 'Failed to update availability');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActiveBookingId(id);
    try {
      await api.put(`/api/bookings/${id}/status`, { status });
      setBookings((current) => current.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(status === 'CONFIRMED' ? 'Booking confirmed' : status === 'COMPLETED' ? 'Marked as complete' : 'Booking declined');
    } catch (err) {
      const msg = err.response?.data;
      toast.error(typeof msg === 'string' ? msg : `Error ${err.response?.status || ''}`);
    } finally {
      setActiveBookingId(null);
    }
  };

  const displayedBookings = useMemo(() => {
    return showAllBookings ? bookings : bookings.slice(0, 1);
  }, [bookings, showAllBookings]);

  return (
      <LiveBackground>
        <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 rounded-[32px] border border-white/10 bg-black/20 px-5 py-4 backdrop-blur-2xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950"><ShieldCheck size={28} /></div>
                <div><p className="text-2xl font-black text-white">ServiceMate</p><p className="text-sm text-slate-400">{labels[form.serviceType] || 'General'} provider workspace</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div ref={bellProviderRef}>
                  <button type="button" onClick={openBellProvider} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-slate-300 transition hover:bg-white/[0.08]">
                    <Bell size={18} />
                    {providerUnread > 0 && <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-400 text-[10px] font-black text-white">{providerUnread}</span>}
                  </button>
                </div>
                <div ref={providerProfileRef}>
                  <button type="button" onClick={openProviderProfile} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 transition hover:bg-white/[0.08]">
                    <div><p className="text-sm font-semibold text-white">{form.name || 'Provider'}</p><p className="text-xs text-slate-400">Provider</p></div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-slate-950">{form.name?.[0] || 'P'}</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Provider profile dropdown portal */}
          {createPortal(
            <AnimatePresence>
              {providerProfileOpen && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setProviderProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'fixed', top: providerProfilePos.top, right: providerProfilePos.right, zIndex: 9999 }}
                    className="w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl"
                  >
                    <button type="button" onClick={(e) => { e.stopPropagation(); setActivePanel(null); setEditing(false); setShowProfileOverlay(true); setProviderProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                      <Settings size={16} className="text-sky-400" /> Manage Account
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setProviderView('reviews'); setProviderProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                      <Star size={16} className="text-amber-400" /> Reviews
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setProviderView('performance'); setProviderProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">
                      <BarChart3 size={16} className="text-emerald-400" /> Analytics
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); clearSession(); navigate('/login', { replace: true }); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/10">
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Bell notifications portal */}
          {createPortal(
            <AnimatePresence>
              {bellProviderOpen && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setBellProviderOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'fixed', top: bellProviderPos.top, right: bellProviderPos.right, zIndex: 9999 }}
                    className="w-80 rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="mb-3 flex items-center justify-between px-1">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <div className="flex items-center gap-2">
                        {providerNotifs.length > 0 && (
                          <button type="button" onClick={() => { clearProviderAll(); setBellProviderOpen(false); }} className="text-xs font-semibold text-cyan-400 transition hover:text-white">Clear all</button>
                        )}
                        <button type="button" onClick={() => setBellProviderOpen(false)} className="text-slate-500 hover:text-white"><X size={15} /></button>
                      </div>
                    </div>
                    {providerNotifs.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-slate-500">No new notifications.</p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {providerNotifs.map((n) => (
                          <div key={n.id} className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm">
                            <p className="font-semibold text-white">{n.title}</p>
                            <p className="mt-0.5 text-xs text-slate-300">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body
          )}

          <AnimatePresence>
            {showProfileOverlay ? (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md sm:p-6"
                style={{ backgroundColor: 'color-mix(in srgb, var(--app-bg) 42%, transparent)' }}>
                <motion.section
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  className="theme-card w-full max-w-2xl rounded-[34px] p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
                >
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Profile</p>
                      <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Manage Account</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editing && (
                        <button type="button" onClick={() => setEditing(true)} className="theme-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold">
                          <Settings size={15} /> Edit Profile
                        </button>
                      )}
                      <button type="button" onClick={() => { setShowProfileOverlay(false); setEditing(false); }} className="theme-button-secondary rounded-2xl px-4 py-2 text-sm font-semibold">Close</button>
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="mb-6 flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-3xl font-black text-white">
                      {form.name?.[0] || 'P'}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[var(--text-primary)]">{form.name || 'Service Professional'}</p>
                      <p className="text-sm text-sky-600">{labels[form.serviceType] || 'General specialist'}</p>
                      <p className="text-sm text-[var(--text-muted)]">{form.city || 'City not added yet'}</p>
                    </div>
                  </div>

                  {editing ? (
                    <form onSubmit={saveProfile} className="space-y-4">
                      {[['Full Name', 'name', 'text', ''], ['Phone', 'phone', 'text', '10-digit number'], ['City *', 'city', 'text', 'Your city'], ['Service Price (₹)', 'price', 'number', 'e.g. 499']].map(([label, field, type, placeholder]) => (
                        <div key={field}>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
                          <input type={type} min={type === 'number' ? 0 : undefined} value={form[field]} onChange={(e) => setForm((c) => ({ ...c, [field]: field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value }))} placeholder={placeholder} required={field === 'name' || field === 'city'} disabled={saving} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                        </div>
                      ))}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Specialty</label>
                        <select value={form.serviceType} disabled={saving} onChange={(e) => setForm((c) => ({ ...c, serviceType: e.target.value }))} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none">
                          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Bio</label>
                        <textarea value={form.bio} disabled={saving} onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))} rows={3} placeholder="A short bio..." className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                      </div>
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'color-mix(in srgb, var(--primary-accent) 20%, var(--border-soft))', background: 'color-mix(in srgb, var(--primary-accent) 10%, var(--surface-soft))' }}>
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--text-primary)]">Profile completion</p><span className="text-xl font-black text-sky-600">{profileCompletion}%</span></div>
                        <div className="mt-3 h-2 rounded-full bg-[var(--border-soft)]"><div className="theme-progress-fill h-2 rounded-full" style={{ width: `${profileCompletion}%` }} /></div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={saving} className="theme-button-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold">
                          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} Save Changes
                        </button>
                        <button type="button" onClick={() => setEditing(false)} className="theme-button-secondary rounded-2xl px-6 py-3 text-sm font-semibold">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      {[['Email', form.email], ['Phone', form.phone || 'Not set'], ['City', form.city || 'Not set'], ['Specialty', labels[form.serviceType] || form.serviceType], ['Service Price', form.price ? `₹ ${form.price}` : 'Not set'], ['Bio', form.bio || 'Not set']].map(([k, v]) => (
                        <div key={k} className="theme-panel rounded-2xl px-5 py-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{k}</p>
                          <p className="mt-1 text-sm text-[var(--text-primary)]">{v}</p>
                        </div>
                      ))}
                      <div className="rounded-2xl border p-4" style={{ borderColor: 'color-mix(in srgb, var(--primary-accent) 20%, var(--border-soft))', background: 'color-mix(in srgb, var(--primary-accent) 10%, var(--surface-soft))' }}>
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--text-primary)]">Profile completion</p><span className="text-xl font-black text-sky-600">{profileCompletion}%</span></div>
                        <div className="mt-3 h-2 rounded-full bg-[var(--border-soft)]"><div className="theme-progress-fill h-2 rounded-full" style={{ width: `${profileCompletion}%` }} /></div>
                      </div>
                    </div>
                  )}
                </motion.section>
              </div>
            ) : null}
          </AnimatePresence>

          {providerView === 'reviews' && (
            <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
              <button type="button" onClick={() => setProviderView('dashboard')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-400"><ArrowLeft size={16} /> Back to dashboard</button>
              <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Reviews</p>
              <h2 className="mt-2 text-3xl font-black text-white mb-6">Recent Reviews</h2>
              <div className="space-y-5 max-w-2xl">
                {providerReviews.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-6 py-12 text-center text-slate-400">No reviews yet.</div>
                ) : providerReviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] text-slate-300"><UserCircle2 size={22} /></div>
                        <div><p className="font-semibold text-white">{r.customerName || 'Customer'}</p><p className="text-xs text-slate-400 mt-0.5">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}</p></div>
                      </div>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className={i < r.rating ? 'text-amber-400' : 'text-slate-600'} fill={i < r.rating ? 'currentColor' : 'none'} />)}</div>
                    </div>
                    <p className="mt-4 text-sm text-slate-300 leading-7">{r.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {providerView === 'performance' && (
            <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
              <button type="button" onClick={() => setProviderView('dashboard')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-400"><ArrowLeft size={16} /> Back to dashboard</button>
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-300">Analytics</p>
              <h2 className="mt-2 text-3xl font-black text-white mb-6">Analytics</h2>

              {/* Tabs */}
              <div className="mb-6 flex gap-2">
                {[['thismonth', 'This Month'], ['overview', 'Performance Overview']].map(([tab, label]) => (
                  <button key={tab} type="button" onClick={() => setAnalyticsTab(tab)}
                    className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${analyticsTab === tab ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {analyticsTab === 'thismonth' && (
                <>
                  <div className="h-56 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#cbd5f5', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }} />
                        <Area type="monotone" dataKey="earnings" stroke="#6366f1" fill="url(#areaGradient2)" strokeWidth={3} animationDuration={1200} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Completed Jobs', metrics.completed], ['Profile Score', `${profileCompletion}%`]].map(([k, v]) => (
                      <div key={k} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-slate-400">{k}</p>
                        <p className="mt-1 text-2xl font-black text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {analyticsTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-3">
                    {[['Completed Jobs', metrics.completed], ['Total Bookings', metrics.total], ['Pending', metrics.pending], ['Completion Rate', metrics.completion], ['Avg Rating', avgRating], ['Profile Score', `${profileCompletion}%`]].map(([k, v]) => (
                      <div key={k} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <p className="text-xs text-slate-400">{k}</p>
                        <p className="mt-2 text-3xl font-black text-white">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={statsChartData}>
                        <defs>
                          <linearGradient id="perfGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#cbd5f5', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' }} />
                        <Line type="monotone" dataKey="value" stroke="url(#perfGradient)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} animationDuration={1200} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </section>
          )}

          {providerView === 'dashboard' && (<>
            <section className="mb-6 rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200"><Sparkles size={14} /> Provider Dashboard</div><h1 className="text-3xl font-black text-white sm:text-5xl">Welcome back, {form.name || 'Service Professional'}</h1><p className="mt-3 max-w-2xl text-sm text-slate-300">Manage bookings, review performance, and keep your profile polished from one workspace.</p></div>
              <button
                  type="button"
                  role="switch"
                  aria-checked={form.availability}
                  disabled={availabilitySaving}
                  onClick={toggleAvailability}
                  className="theme-button-secondary inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
              <span
                  className={`relative inline-flex h-7 w-13 items-center rounded-full border transition-colors ${
                      form.availability
                          ? 'border-emerald-300/40 bg-emerald-400/20'
                          : 'border-[var(--border-soft)] bg-[var(--surface-soft)]'
                  }`}
                  style={{ width: '3.25rem' }}
              >
                <span
                    className={`absolute h-5 w-5 rounded-full transition-transform ${
                        form.availability
                            ? 'bg-emerald-400'
                            : 'bg-[var(--text-muted)]'
                    }`}
                    style={{ transform: `translateX(${form.availability ? '1.75rem' : '0.25rem'})` }}
                />
              </span>
                <span>{availabilitySaving ? 'Updating...' : form.availability ? 'Available for new jobs' : 'Currently offline'}</span>
              </button>
            </div>
            </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statStyles.map(([fallbackValue, label, change, Icon, tint], index) => {
              const value = label === 'Active Bookings' ? metrics.total : label === 'Completion Rate' ? metrics.completion : fallbackValue;
              return <motion.div key={label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-[30px] border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-xl"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-400"><Icon size={22} /></div><p className="text-4xl font-black text-white">{value}</p><p className="mt-2 text-sm text-slate-500">{label}</p></motion.div>;
            })}
          </section>

          <div className={`grid gap-6 ${activePanel ? 'xl:grid-cols-[2fr_1fr]' : 'xl:grid-cols-1'}`}>
            <div className="space-y-6">
              <section className="mb-6 rounded-[30px] border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Today's Summary</h3>
                  <span className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
                    <p className="text-2xl font-black text-white">{todayStats.total}</p>
                    <p className="text-xs text-slate-500">Jobs</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
                    <p className="text-2xl font-black text-slate-200">{todayStats.pending}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">
                    <p className="text-2xl font-black text-slate-200">{todayStats.confirmed}</p>
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                </div>
              </section>
              <section className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl">
                <div className="border-b border-white/10 px-6 py-6 sm:px-8">
                  <h2 className="text-3xl font-black text-white">Bookings</h2>
                  <p className="mt-1 text-sm text-slate-400">Manage incoming requests and confirmed jobs.</p>
                  <div className="mt-4 flex gap-2">
                    {[['confirmed', 'Confirmed', bookings.filter(b => b.status === 'CONFIRMED').length], ['pending', 'New Requests', metrics.pending]].map(([tab, label, count]) => (
                      <button key={tab} type="button" onClick={() => setBookingTab(tab)}
                        className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${bookingTab === tab ? 'bg-white text-slate-950' : 'border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white'}`}>
                        {label} {count > 0 && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${bookingTab === tab ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-300'}`}>{count}</span>}
                      </button>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center px-6 py-20 text-slate-400"><LoaderCircle size={36} className="animate-spin" /><p className="mt-4 text-sm">Loading...</p></div>
                ) : (() => {
                  const filtered = bookings.filter(b => bookingTab === 'pending' ? b.status === 'PENDING' : b.status === 'CONFIRMED');
                  if (!filtered.length) return (
                    <div className="px-6 py-16 text-center">
                      <p className="text-lg font-semibold text-white">{bookingTab === 'pending' ? 'No pending requests' : 'No confirmed bookings'}</p>
                      <p className="mt-2 text-sm text-slate-400">{bookingTab === 'pending' ? 'New customer requests will appear here.' : 'Confirmed jobs will appear here.'}</p>
                    </div>
                  );
                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="bg-white/[0.05] text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          <tr>
                            <th className="px-6 py-4 sm:px-8">Service</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((b) => (
                            <tr key={b.id} className="border-t border-white/8 text-sm text-slate-300">
                              <td className="px-6 py-5 sm:px-8">
                                <div className="flex flex-col gap-1">
                                  {b.description?.startsWith('[PRIORITY]') && (
                                    <span className="inline-flex w-fit rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs font-bold text-rose-300">Priority</span>
                                  )}
                                  <p className="font-semibold text-white">
                                    {b.description?.startsWith('[PRIORITY]') ? b.description.replace('[PRIORITY]', '').trim() : (b.description || 'Customer request')}
                                  </p>
                                  <p className="text-xs text-slate-500">{labels[form.serviceType] || 'General service'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <p className="font-semibold text-white">{b.customerName || 'Customer'}</p>
                                <p className="mt-1 text-xs text-slate-500">{b.customerCity || '—'}</p>
                              </td>
                              <td className="px-6 py-5 font-semibold text-white">
                                {b.bookingDate ? formatDate(b.bookingDate, { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—'}
                              </td>
                              <td className="px-6 py-5">
                                <p>{b.customerPhone ? `+91 ${b.customerPhone}` : '—'}</p>
                                <p className="mt-1 text-xs text-slate-500">{b.customerEmail || '—'}</p>
                              </td>
                              <td className="px-6 py-5">
                                {bookingTab === 'pending' ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => updateStatus(b.id, 'CONFIRMED')} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-black transition hover:bg-emerald-300">Confirm</button>
                                    <button onClick={() => updateStatus(b.id, 'CANCELLED')} className="rounded-xl bg-rose-400/20 border border-rose-400/30 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-400/30">Decline</button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    {(() => {
                                      const today = new Date(); today.setHours(0,0,0,0);
                                      const bookingDate = b.bookingDate ? new Date(`${b.bookingDate}T00:00:00`) : null;
                                      const canComplete = bookingDate && bookingDate <= today;
                                      return (
                                        <>
                                          <button onClick={() => updateStatus(b.id, 'COMPLETED')} disabled={!canComplete} title={!canComplete ? 'Date has not arrived yet' : ''} className="rounded-xl bg-sky-400/20 border border-sky-400/30 px-3 py-2 text-xs font-bold text-sky-300 transition hover:bg-sky-400/30 disabled:opacity-40 disabled:cursor-not-allowed">Mark Complete</button>
                                          <button onClick={() => setSelectedBooking(b)} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/[0.08]">Details</button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </section>

            </div>

            <aside className="space-y-6">
              {activePanel === 'notifications' ? (
                  <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
                    <div className="mb-5 flex items-center justify-between">
                      <div><p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Notifications</p><h2 className="mt-2 text-2xl font-black text-white">Recent Alerts</h2></div>
                      <div className="flex items-center gap-3">
                        {providerNotifs.length > 0 && (
                          <button type="button" onClick={clearProviderAll} className="text-xs font-semibold text-cyan-300 transition hover:text-white">Clear all</button>
                        )}
                        <button type="button" onClick={() => setActivePanel(null)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white">Close</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {providerNotifs.length === 0 ? (
                        <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-400">No new notifications right now.</div>
                      ) : (
                        providerNotifs.map((n) => (
                          <div key={n.id} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm">
                            <p className="font-semibold text-white">{n.title}</p>
                            <p className="mt-1 text-slate-300">{n.body}</p>
                          </div>
                        ))
                      )}
                      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-slate-300">
                        <p className="font-semibold text-white">Availability status</p>
                        <p className="mt-1 text-slate-400">{form.availability ? 'You are visible for new bookings.' : 'You are currently offline for new bookings.'}</p>
                      </div>
                    </div>
                  </section>
              ) : null}

              {activePanel === 'messages' ? (
                  <section className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
                    <div className="mb-5 flex items-center justify-between"><div><p className="text-sm uppercase tracking-[0.18em] text-cyan-300">Messages</p><h2 className="mt-2 text-2xl font-black text-white">Inbox</h2></div><button type="button" onClick={() => setActivePanel(null)} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white">Close</button></div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-5 text-sm text-slate-300">
                      Messaging UI is reserved here. Customer conversations are not connected yet, but this top-bar action now controls the visible panel.
                    </div>
                  </section>
              ) : null}

              {activePanel === 'reviews' ? null : null}
              {activePanel === 'performance' ? null : null}


            </aside>
          </div>
          </>)}
        </div>
        <AnimatePresence>
          {selectedBooking && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-2xl"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-400">Booking Details</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedBooking.customerName || 'Customer'}</h2>
                    <p className="mt-1 text-sm text-slate-400">{selectedBooking.customerCity || 'City not provided'}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                    selectedBooking.status === 'CONFIRMED' ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200' :
                    selectedBooking.status === 'PENDING' ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' :
                    'border-rose-300/20 bg-rose-300/10 text-rose-200'
                  }`}>{selectedBooking.status}</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <Mail size={15} className="text-cyan-400 shrink-0" />
                    <span className="text-slate-300">{selectedBooking.customerEmail || 'Email not available'}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <Phone size={15} className="text-cyan-400 shrink-0" />
                    <span className="text-slate-300">{selectedBooking.customerPhone ? `+91 ${selectedBooking.customerPhone}` : 'Phone not available'}</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <CalendarDays size={15} className="text-cyan-400 shrink-0" />
                    <span className="text-slate-300">{formatDate(selectedBooking.bookingDate)}</span>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    <p className="mb-1 text-xs text-slate-500">Description</p>
                    <p className="text-slate-300 leading-6">
                      {selectedBooking.description?.startsWith('[PRIORITY]')
                        ? selectedBooking.description.replace('[PRIORITY]', '').trim()
                        : selectedBooking.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <button type="button" onClick={() => setSelectedBooking(null)} className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </LiveBackground>
  );
};

export default ProviderDashboard;