import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const AuthLayout = ({ children, title, subtitle, eyebrow }) => {
  return (
    <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl justify-end">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="theme-card w-full max-w-md rounded-[2rem] p-6 sm:p-8"
      >
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="theme-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
            >
              <ChevronLeft size={14} />
              Back
            </Link>
            <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-[var(--text-primary)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm text-white">
                S
              </span>
              ServiceMate
            </Link>
            <div className="w-[58px]" />
          </div>
          <div className="mt-5 text-center">
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {subtitle}
            </p>
          </div>
        </div>
        {children}
      </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
