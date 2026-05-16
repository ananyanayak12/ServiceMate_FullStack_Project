import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Bell, CalendarDays, ChevronRight, Loader2, LogOut, MapPin, Search, ShieldCheck,
  Sparkles, Star, Wrench, Zap, Paintbrush, Droplets, Hammer, Bug, Wind, X, Phone, Mail,
  Clock3, Settings, LayoutGrid,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import LiveBackground from '../components/LiveBackground';
import ThemeToggle from '../components/ThemeToggle';
import { useNotifications } from '../hooks/useNotifications';

const categories = [
  ['Deep Cleaning', Paintbrush, 'Expert home and office detailing.'],
  ['Electrical', Zap, 'Diagnostics, wiring, and installs.'],
  ['Appliance Repair', Wrench, 'Fridge, washer, and gadget fixes.'],
  ['Plumbing', Droplets, 'Leak repairs and pipe fitting.'],
  ['Carpentry', Hammer, 'Furniture and custom woodwork.'],
  ['Pest Control', Bug, 'Rodent and insect management.'],
  ['AC Service', Wind, 'Installation, servicing, and gas charging.'],
  ['Home Safety', ShieldCheck, 'CCTV and smart lock setup.'],
];

const labels = {
  plumbing: 'Plumbing', electrical: 'Electrical', cleaning: 'Cleaning', carpentry: 'Carpentry',
  'deep cleaning': 'Deep Cleaning', 'appliance repair': 'Appliance Repair',
  'pest control': 'Pest Control', 'ac service': 'AC Service', 'home safety': 'Home Safety',
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const bookingStatusClass = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-sky-200 bg-sky-50 text-sky-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

const formatDate = (value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(`${value}T00:00:00`)) : 'Date not provided';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // view: 'services' | 'bookings' | 'account' | 'listing'
  const [view, setView] = useState('services');
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // account edit
  const [bookingTab, setBookingTab] = useState('upcoming');
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '', phone: user?.phone || '', city: user?.city || '', bio: user?.bio || '',
  });
  const [accountEdit, setAccountEdit] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);

  // profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // bell dropdown
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const [bellPos, setBellPos] = useState({ top: 0, right: 0 });

  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications(customerBookings, 'customer', user?.id);

  const openProfile = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setProfileOpen((o) => !o);
  };

  const openBell = () => {
    if (bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setBellPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setBellOpen((o) => {
      if (!o) markAllRead();
      return !o;
    });
  };

  const goTo = (v) => { setView(v); setProfileOpen(false); };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const category = fd.get('category');
    const date = fd.get('date');
    const description = fd.get('description');

    if (!category) { toast.error('Please select a service category.'); return; }
    if (!date) { toast.error('Please select a date.'); return; }

    setPriorityLoading(true);
    try {
      const res = await api.get(`/api/providers/specialty/${encodeURIComponent(category.toLowerCase())}`);
      const available = (Array.isArray(res.data) ? res.data : []).filter((p) => p.availability !== false);
      if (!available.length) {
        toast.error(`No providers available for ${category} right now. Try another category.`);
        return;
      }
      await api.post('/api/bookings/create', {
        userId: Number(user.id),
        providerId: Number(available[0].id),
        bookingDate: date,
        description: `[PRIORITY] ${description}`,
      });
      toast.success('Priority booking requested!');
      setPriorityOpen(false);
      e.target.reset();
      loadCustomerBookings(true);
    } catch (err) {
      toast.error(err.response?.data || 'Priority booking failed.');
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAccountSave = async (e) => {
    e.preventDefault();
    setAccountSaving(true);
    try {
      const res = await api.put('/api/auth/profile', { id: Number(user.id), ...accountForm });
      const updated = res.data.user || res.data;
      localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      toast.success('Profile updated.');
      setAccountEdit(false);
    } catch (err) {
      toast.error(err.response?.data || 'Update failed.');
    } finally {
      setAccountSaving(false);
    }
  };

  const loadProviders = (showLoader = false, city = locationSearch, category = selectedCategory) => {
    if (!category) return Promise.resolve();
    if (showLoader) setLoading(true);
    const cityParam = city.trim() ? `?city=${encodeURIComponent(city.trim())}` : '';
    return api
      .get(`/api/providers/specialty/${category.toLowerCase()}${cityParam}`)
      .then((res) => {
        const next = (Array.isArray(res.data) ? res.data : []).filter((p) => p.availability !== false);
        setProviders(next);
        setBookingProvider((cur) => (cur && !next.some((p) => p.id === cur.id) ? null : cur));
      })
      .catch(() => toast.error('Database connection failed.'))
      .finally(() => { if (showLoader) setLoading(false); });
  };

  const loadCustomerBookings = (showLoader = false) => {
    if (!user?.id) return Promise.resolve();
    if (showLoader) setBookingsLoading(true);
    return api
      .get(`/api/bookings/user/${user.id}`)
      .then((res) => setCustomerBookings(Array.isArray(res.data) ? res.data : []))
      .catch(() => { if (showLoader) toast.error('Failed to load your bookings.'); })
      .finally(() => { if (showLoader) setBookingsLoading(false); });
  };

  useEffect(() => {
    loadCustomerBookings(true);
    const id = window.setInterval(() => loadCustomerBookings(false), 3000);
    return () => window.clearInterval(id);
  }, [user?.id]);

  useEffect(() => {
    if (view !== 'listing' || !selectedCategory) return;
    loadProviders(true, locationSearch, selectedCategory);
    const id = window.setInterval(() => loadProviders(false, locationSearch, selectedCategory), 3000);
    return () => window.clearInterval(id);
  }, [view, selectedCategory, locationSearch]);

  const [locationProviders, setLocationProviders] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (!locationSearch.trim()) { setLocationProviders([]); return; }
    setLocationLoading(true);
    api.get(`/api/providers?city=${encodeURIComponent(locationSearch.trim())}`)
      .then((res) => setLocationProviders(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, [locationSearch]);

  const filteredCategories = useMemo(
    () => categories.filter(([name]) => name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/api/bookings/create', {
        userId: Number(user.id), providerId: Number(bookingProvider.id),
        bookingDate: fd.get('date'), description: fd.get('description'),
      });
      toast.success('Booking successful!');
      setBookingProvider(null);
      loadCustomerBookings(false);
    } catch (err) {
      toast.error(err.response?.data || 'Booking failed.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewSaving(true);
    try {
      await api.post('/api/reviews', {
        bookingId: reviewBooking.id,
        userId: Number(user.id),
        providerId: reviewBooking.providerId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted!');
      setReviewBooking(null);
      setReviewRating(5);
      setReviewComment('');
      loadCustomerBookings(false);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to submit review.');
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <LiveBackground>
      {/* Priority booking modal */}
      <AnimatePresence>
        {priorityOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="theme-card w-full max-w-lg rounded-[2rem] p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-500">Priority Request</p>
                  <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Urgent Booking</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">We'll assign the first available expert right away.</p>
                </div>
                <button type="button" onClick={() => setPriorityOpen(false)} className="theme-button-secondary rounded-full p-2 text-[var(--text-muted)]"><X size={18} /></button>
              </div>
              <form onSubmit={handlePrioritySubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Service Category</label>
                  <select name="category" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none">
                    <option value="">Select a category</option>
                    {categories.map(([name]) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Preferred Date</label>
                  <input name="date" type="date" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-4 text-[var(--text-primary)] outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Describe the issue</label>
                  <textarea name="description" required placeholder="What needs urgent attention?" rows={4} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-4 text-[var(--text-primary)] outline-none" />
                </div>
                <button type="submit" disabled={priorityLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-4 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
                  {priorityLoading && <Loader2 size={16} className="animate-spin" />}
                  {priorityLoading ? 'Finding provider...' : 'Request Priority Now'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review modal */}
      <AnimatePresence>
        {reviewBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="theme-card w-full max-w-md rounded-[2rem] p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Leave a Review</p>
                  <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">{reviewBooking.providerName}</h2>
                  <p className="text-sm text-[var(--text-muted)]">{labels[reviewBooking.providerServiceType] || reviewBooking.providerServiceType}</p>
                </div>
                <button type="button" onClick={() => setReviewBooking(null)} className="theme-button-secondary rounded-full p-2"><X size={18} /></button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Rating</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewRating(star)}
                        className={`text-3xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-[var(--border-soft)]'}`}>
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Comment</p>
                  <textarea required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} placeholder="Share your experience..." className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                </div>
                <button type="submit" disabled={reviewSaving} className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold">
                  {reviewSaving && <Loader2 size={15} className="animate-spin" />} Submit Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {bookingProvider && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="theme-card w-full max-w-lg rounded-[2rem] p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Confirm Booking</p>
                  <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">{bookingProvider.name}</h2>
                </div>
                <button type="button" onClick={() => setBookingProvider(null)} className="theme-button-secondary rounded-full p-2 text-[var(--text-muted)]"><X size={18} /></button>
              </div>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <input name="date" type="date" required className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-4 text-[var(--text-primary)] outline-none" />
                <textarea name="description" required placeholder="Describe the issue or requirement" rows={5} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-4 text-[var(--text-primary)] outline-none" />
                <button type="submit" className="theme-button-primary w-full rounded-2xl px-5 py-4 text-sm font-bold">Request Service</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Navbar */}
        <div className="theme-card mb-6 overflow-visible rounded-[32px] px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-black text-white">S</div>
              <div>
                <p className="text-2xl font-black text-[var(--text-primary)]">ServiceMate</p>
                <p className="text-sm text-[var(--text-muted)]">Customer workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div ref={bellRef}>
                <button type="button" onClick={openBell} className="theme-button-secondary relative rounded-2xl p-3 text-[var(--text-muted)]">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">{unreadCount}</span>
                  )}
                </button>
              </div>
              <ThemeToggle />
              <div ref={profileRef}>
                <button type="button" onClick={openProfile} className="theme-panel flex items-center gap-3 rounded-2xl px-4 py-2 transition hover:opacity-90">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name || 'Customer'}</p>
                    <p className="text-xs text-[var(--text-muted)]">Customer</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text-primary)] text-sm font-black text-[var(--panel-strong)]">
                    {user?.name?.[0] || 'C'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile dropdown via portal */}
        {createPortal(
          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-[9998]" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
                  className="theme-card w-56 rounded-2xl p-2 shadow-xl"
                >
                  <button type="button" onClick={(e) => { e.stopPropagation(); goTo('services'); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]">
                    <LayoutGrid size={16} className="text-sky-500" /> Browse Services
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); goTo('bookings'); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]">
                    <CalendarDays size={16} className="text-sky-500" /> Your Bookings
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); goTo('account'); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]">
                    <Settings size={16} className="text-sky-500" /> Manage Account
                  </button>
                  <div className="my-1 border-t border-[var(--border-soft)]" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); clearSession(); navigate('/login', { replace: true }); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-50">
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Bell notifications dropdown via portal */}
        {createPortal(
          <AnimatePresence>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-[9998]" onClick={() => setBellOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'fixed', top: bellPos.top, right: bellPos.right, zIndex: 9999 }}
                  className="theme-card w-80 rounded-2xl p-3 shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Notifications</p>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <button type="button" onClick={() => { clearAll(); setBellOpen(false); }} className="text-xs font-semibold text-sky-500 transition hover:text-sky-600">Clear all</button>
                      )}
                      <button type="button" onClick={() => setBellOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={15} /></button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-[var(--text-muted)]">No notifications yet.</p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`rounded-xl px-4 py-3 text-sm ${n.type === 'confirmed' ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : n.type === 'cancelled' ? 'border border-rose-200 bg-rose-50 text-rose-800' : 'border border-[var(--border-soft)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'}`}>
                          <p className="font-semibold">{n.title}</p>
                          <p className="mt-0.5 text-xs opacity-80">{n.body}</p>
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

        {/* ── Services view ── */}
        {view === 'services' && (
          <section className="space-y-6">
            <div className="theme-card rounded-[34px] p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-sky-600">
                    <Sparkles size={14} /> Customer Dashboard
                  </div>
                  <h2 className="text-3xl font-black text-[var(--text-primary)]">Browse Services</h2>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Pick a category and see available experts.</p>
                </div>
                <div className="flex w-full flex-row gap-2 sm:max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services" className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-[var(--text-primary)] outline-none" />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder="Filter by city (optional)" className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] py-3 pl-11 pr-4 text-[var(--text-primary)] outline-none" />
                  </div>
                </div>
              </div>
              {locationSearch.trim() ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
                      <MapPin size={12} /> Providers in "{locationSearch.trim()}"
                    </div>
                    <button type="button" onClick={() => setLocationSearch('')} className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">Clear location</button>
                  </div>
                  {locationLoading ? (
                    <div className="flex items-center justify-center py-16 text-[var(--text-muted)]"><Loader2 className="animate-spin" size={28} /></div>
                  ) : locationProviders.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="bg-[var(--surface-soft)] text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          <tr><th className="px-4 py-4">Provider</th><th className="px-4 py-4">City</th><th className="px-4 py-4">Specialty</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Action</th></tr>
                        </thead>
                        <tbody>
                          {locationProviders.map((pro) => (
                            <tr key={pro.id} className="border-t border-[var(--border-soft)] text-sm text-[var(--text-secondary)]">
                              <td className="px-4 py-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 font-black text-sky-600">{pro.name?.[0]}</div><p className="font-semibold text-[var(--text-primary)]">{pro.name}</p></div></td>
                              <td className="px-4 py-5"><span className="inline-flex items-center gap-1"><MapPin size={13} className="text-sky-400" />{pro.city || '—'}</span></td>
                              <td className="px-4 py-5 capitalize">{pro.serviceType || '—'}</td>
                              <td className="px-4 py-5 font-black text-[var(--text-primary)]">Rs {pro.price || '499'}</td>
                              <td className="px-4 py-5"><button type="button" onClick={() => setBookingProvider(pro)} className="theme-button-primary rounded-2xl px-4 py-2 text-sm font-bold">Book Now</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="theme-panel rounded-[2rem] border border-dashed px-6 py-14 text-center">
                      <p className="text-lg font-semibold text-[var(--text-primary)]">No providers found in "{locationSearch.trim()}".</p>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">Try a different city name.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {filteredCategories.map(([name, Icon, desc]) => (
                    <button key={name} type="button" onClick={() => { setSelectedCategory(name); setView('listing'); loadProviders(true, locationSearch, name); }} className="theme-panel rounded-[2rem] p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500"><Icon size={24} /></div>
                      <p className="text-2xl font-bold text-[var(--text-primary)]">{name}</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{desc}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-600">Explore experts <ChevronRight size={16} /></span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── action row ── */}
            <div className="grid gap-4">
              <div className="rounded-[34px] border border-sky-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-sm">
                <CalendarDays className="text-sky-500" size={26} />
                <h3 className="mt-4 text-xl font-black text-slate-900">Priority Booking</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Need urgent help? Get connected with the first available expert right away.</p>
                <button type="button" onClick={() => setPriorityOpen(true)} className="theme-button-primary mt-5 rounded-2xl px-5 py-3 text-sm font-bold">Request Priority</button>
              </div>
            </div>
          </section>
        )}

        {/* ── Bookings view ── */}
        {view === 'bookings' && (
          <section className="theme-card rounded-[34px] p-6 sm:p-8">
            <button type="button" onClick={() => setView('services')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-600"><ArrowLeft size={16} /> Back to services</button>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Your Bookings</p>
                <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Track accepted and pending requests</h2>
              </div>
              <span className="theme-panel rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">{customerBookings.length} total</span>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2">
              {['upcoming', 'past'].map((tab) => (
                <button key={tab} type="button" onClick={() => setBookingTab(tab)}
                  className={`rounded-2xl px-5 py-2 text-sm font-bold capitalize transition ${bookingTab === tab ? 'bg-sky-500 text-white' : 'theme-button-secondary text-[var(--text-muted)]'}`}>
                  {tab === 'upcoming' ? 'Upcoming' : 'Past'}
                </button>
              ))}
            </div>

            {bookingsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
                <Loader2 className="mb-4 animate-spin" size={32} /><p>Loading your bookings...</p>
              </div>
            ) : (() => {
              const today = new Date(); today.setHours(0,0,0,0);
              const filtered = customerBookings.filter((b) => {
                const d = b.bookingDate ? new Date(`${b.bookingDate}T00:00:00`) : null;
                return bookingTab === 'upcoming' ? (!d || d >= today) : (d && d < today);
              });

              if (!filtered.length) return (
                <div className="theme-panel rounded-[2rem] border border-dashed px-6 py-14 text-center">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">No {bookingTab} bookings.</p>
                </div>
              );

              return (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((booking) => {
                    const isPriority = booking.description?.startsWith('[PRIORITY]');
                    return (
                      <div key={booking.id} className="theme-panel rounded-[2rem] p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">{booking.providerName || 'Assigned provider'}</p>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">{labels[booking.providerServiceType] || booking.providerServiceType || 'Service provider'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPriority && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-500">Priority</span>
                            )}
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${bookingStatusClass[booking.status] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>{booking.status}</span>
                            {booking.status === 'COMPLETED' && !booking.reviewSubmitted && (
                              <button type="button" onClick={() => { setReviewBooking(booking); setReviewRating(5); setReviewComment(''); }} className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600 transition hover:bg-sky-100">
                                ★ Review
                              </button>
                            )}
                            {booking.reviewSubmitted && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">✓ Reviewed</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                          <div className="flex items-center gap-2"><Clock3 size={16} className="text-sky-500" /><span>{formatDate(booking.bookingDate)}</span></div>
                          <div className="flex items-center gap-2"><Phone size={16} className="text-sky-500" /><span>{booking.providerPhone ? `+91 ${booking.providerPhone}` : 'Phone not available yet'}</span></div>
                          <div className="flex items-center gap-2"><Mail size={16} className="text-sky-500" /><span>{booking.providerEmail || 'Email not available yet'}</span></div>
                          <p className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 leading-7 text-[var(--text-secondary)]">{isPriority ? booking.description.replace('[PRIORITY]', '').trim() : (booking.description || 'No description provided.')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {/* ── Account view ── */}
        {view === 'account' && (
          <section className="theme-card mx-auto max-w-2xl rounded-[34px] p-6 sm:p-8">
            <button type="button" onClick={() => setView('services')} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-600"><ArrowLeft size={16} /> Back to services</button>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-500">Profile</p>
                <h2 className="mt-2 text-3xl font-black text-[var(--text-primary)]">Manage Account</h2>
              </div>
              {!accountEdit && (
                <button type="button" onClick={() => setAccountEdit(true)} className="theme-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold">
                  <Settings size={15} /> Edit Profile
                </button>
              )}
            </div>
            <div className="mb-6 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-3xl font-black text-white">
                {user?.name?.[0] || 'C'}
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{user?.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
                <span className="mt-1 inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">{user?.role}</span>
              </div>
            </div>
            {accountEdit ? (
              <form onSubmit={handleAccountSave} className="space-y-4">
                {[['Full Name', 'name', 'text', ''], ['Phone', 'phone', 'text', '10-digit number'], ['City', 'city', 'text', 'Your city']].map(([label, field, type, placeholder]) => (
                  <div key={field}>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
                    <input type={type} value={accountForm[field]} onChange={(e) => setAccountForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} required={field === 'name'} className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Bio</label>
                  <textarea value={accountForm.bio} onChange={(e) => setAccountForm((f) => ({ ...f, bio: e.target.value }))} rows={3} placeholder="A short bio..." className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--text-primary)] outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={accountSaving} className="theme-button-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold">
                    {accountSaving && <Loader2 size={15} className="animate-spin" />} Save Changes
                  </button>
                  <button type="button" onClick={() => setAccountEdit(false)} className="theme-button-secondary rounded-2xl px-6 py-3 text-sm font-semibold">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {[['Phone', user?.phone || 'Not set'], ['City', user?.city || 'Not set'], ['Bio', user?.bio || 'Not set']].map(([k, v]) => (
                  <div key={k} className="theme-panel rounded-2xl px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{k}</p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Provider listing view ── */}
        {view === 'listing' && (
          <section className="theme-card rounded-[34px] p-6 sm:p-8">
            <button type="button" onClick={() => { setView('services'); setSelectedCategory(''); }} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-sky-600"><ArrowLeft size={16} /> Back to services</button>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black text-[var(--text-primary)]">{selectedCategory} Pros</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Verified providers available for this category.</p>
                {locationSearch.trim() && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
                    <MapPin size={12} /> {locationSearch.trim()}
                    <button type="button" onClick={() => setLocationSearch('')} className="ml-1 text-sky-400 hover:text-sky-600"><X size={11} /></button>
                  </div>
                )}
              </div>
              <span className="theme-panel rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">{providers.length} providers</span>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
                <Loader2 className="mb-4 animate-spin" size={36} /><p>Loading providers...</p>
              </div>
            ) : providers.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[var(--surface-soft)] text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <tr><th className="px-4 py-4">Provider</th><th className="px-4 py-4">City</th><th className="px-4 py-4">Trust</th><th className="px-4 py-4">Price</th><th className="px-4 py-4">Action</th></tr>
                  </thead>
                  <tbody>
                    {providers.map((pro) => (
                      <tr key={pro.id} className="border-t border-[var(--border-soft)] text-sm text-[var(--text-secondary)]">
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 font-black text-sky-600">{pro.name?.[0]}</div>
                            <div><p className="font-semibold text-[var(--text-primary)]">{pro.name}</p><p className="text-xs text-[var(--text-muted)]">{selectedCategory} specialist</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]"><MapPin size={13} className="text-sky-400" />{pro.city || 'Not specified'}</span>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" />4.8</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck size={14} />Verified</span>
                          </div>
                        </td>
                        <td className="px-4 py-5 font-black text-[var(--text-primary)]">Rs {pro.price || '499'}</td>
                        <td className="px-4 py-5">
                          <button type="button" onClick={() => setBookingProvider(pro)} className="theme-button-primary rounded-2xl px-4 py-3 text-sm font-bold">Book Now</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="theme-panel rounded-[2rem] border border-dashed px-6 py-14 text-center">
                <p className="text-lg font-semibold text-[var(--text-primary)]">No experts found for "{selectedCategory}" yet.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </LiveBackground>
  );
};

export default CustomerDashboard;
