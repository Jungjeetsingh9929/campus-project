import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

type Mode = 'login' | 'register' | 'reset';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState(new URLSearchParams(window.location.search).get('resetToken') ?? '');
  const [resetRequested, setResetRequested] = useState(Boolean(resetToken));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials);
  const registerStudent = useAuthStore((state) => state.registerStudent);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const completePasswordReset = useAuthStore((state) => state.completePasswordReset);
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await loginWithCredentials(email, password);
        navigate('/');
        return;
      }

      if (mode === 'register') {
        await registerStudent({ name, email, password, rollNumber, phone });
        setMode('login');
        setPassword('');
        setMessage('Registration complete. Your student account can sign in now.');
        return;
      }

      if (!resetRequested) {
        await forgotPassword(email);
        setResetRequested(true);
        setMessage('If an account exists for that email, reset instructions have been sent. Enter the reset token to continue.');
        return;
      }

      await completePasswordReset(resetToken, newPassword, confirmPassword);
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setResetToken('');
      setResetRequested(false);
      setMessage('Password reset complete. Sign in with your new password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-mesh-gradient px-4 py-8 text-white">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-glow backdrop-blur-xl"
      >
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 lg:p-10">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Unified Campus Operations</div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Digital twin, complaints, safety, and administration in one portal.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Role-based access controls keep students, faculty, administrators, and security teams inside the right workspace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'Student complaint ownership',
                'Admin assignment workflow',
                'Emergency action logging',
                'Persistent account sessions',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/65 p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm">
              {[
                ['login', 'Sign in'],
                ['register', 'Register'],
                ['reset', 'Reset'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setMode(key as Mode);
                    setError(null);
                    setMessage(null);
                    setResetRequested(key === 'reset' && Boolean(resetToken));
                  }}
                  className={[
                    'flex-1 rounded-xl px-3 py-2 font-semibold transition',
                    mode === key ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/10',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4">
              {mode === 'register' && (
                <>
                  <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50" placeholder="Full name" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50" placeholder="Roll number" />
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50" placeholder="Phone" />
                  </div>
                </>
              )}

              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                placeholder="name@campus.edu"
              />

              {mode !== 'reset' ? (
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                  placeholder={mode === 'login' ? 'Password' : 'Create password'}
                />
              ) : (
                <>
                  {resetRequested && (
                    <input
                      value={resetToken}
                      onChange={(event) => setResetToken(event.target.value)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                      placeholder="Reset token from email"
                    />
                  )}
                  {resetRequested && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                        placeholder="New password"
                      />
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/50"
                        placeholder="Confirm password"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <button type="submit" className="mt-6 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              {mode === 'login' && 'Enter portal'}
              {mode === 'register' && 'Create student account'}
              {mode === 'reset' && (resetRequested ? 'Complete reset' : 'Send reset link')}
            </button>

            {message && <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</p>}
            {error && <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
          </div>
        </div>
      </motion.form>
    </div>
  );
}
