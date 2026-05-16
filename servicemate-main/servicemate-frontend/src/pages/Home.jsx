import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Wrench, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import LiveBackground from '../components/LiveBackground';
import ThemeToggle from '../components/ThemeToggle';

const Home = () => {
  return (
    <LiveBackground>
      <div className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
        <header className="theme-card mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 rounded-[2rem] px-6 py-3 sm:flex-nowrap sm:rounded-full sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-[var(--text-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-base text-white">
              S
            </span>
            ServiceMate
          </Link>
          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <nav className="flex items-center gap-3">
              <Link
                to="/login"
                className="theme-pill rounded-full px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-2xl px-6 py-3 text-sm font-bold text-[var(--primary-contrast)] transition-colors shadow-[0_12px_24px_rgba(42,131,246,0.16)]"
                style={{ backgroundColor: 'var(--primary-accent)' }}
              >
                Sign Up
              </Link>
            </nav>
            <ThemeToggle className="shrink-0" />
          </div>
        </header>

        <main className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-7xl items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Home Services Platform
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight text-[var(--text-primary)] sm:text-6xl lg:text-7xl">
              Book trusted services and manage every job in one place.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              ServiceMate helps customers find providers faster and gives professionals a cleaner workspace for
              handling requests, schedules, and follow-ups.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/signup" className="btn-glow w-auto min-w-[196px] px-8">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="theme-card flex min-w-[196px] items-center justify-center rounded-[1.5rem] px-8 py-4 font-semibold text-[var(--text-primary)] transition-opacity hover:opacity-80"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="theme-card rounded-[2rem] p-6"
          >
            <div className="grid gap-4">
              <div className="theme-panel rounded-3xl p-6">
                <ShieldCheck className="text-[var(--text-muted)]" size={22} />
                <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">Secure customer and provider access</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  Separate role-based flows with a simple entry point and cleaner account setup.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="theme-panel rounded-3xl p-6">
                  <Users className="text-[var(--text-muted)]" size={22} />
                  <h3 className="mt-5 text-lg font-bold text-[var(--text-primary)]">For customers</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Request help, track progress, and stay connected with service providers.
                  </p>
                </div>
                <div className="theme-panel rounded-3xl p-6">
                  <Wrench className="text-[var(--text-muted)]" size={22} />
                  <h3 className="mt-5 text-lg font-bold text-[var(--text-primary)]">For providers</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Organize incoming work, manage your service type, and respond faster.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </LiveBackground>
  );
};

export default Home;
