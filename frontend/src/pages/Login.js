import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PAGE_BACKGROUND = '/images/bg1.jfif';
const LESOTHO_LOGO = '/images/lesotho2.jfif';

/* ============================================================
   ICONS
============================================================ */
const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.3 18.3 0 0 1-3.1 3.9M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.5-.7" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
    warning: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

/* ============================================================
   LOGO
============================================================ */
const Logo = () => (
  <div className="brand">
    <span className="brand__mark"><img src={LESOTHO_LOGO} alt="" /></span>
    <span className="brand__copy"><strong>MyGov</strong><small>Lesotho</small></span>
  </div>
);

/* ============================================================
   ERROR MESSAGE MAPPER — decides icon + style per error
============================================================ */
const getErrorMeta = (code) => {
  const map = {
    MISSING_FIELDS: { type: 'warning', icon: 'warning' },
    MISSING_NATIONAL_ID: { type: 'warning', icon: 'warning' },
    MISSING_PASSWORD: { type: 'warning', icon: 'warning' },
    USER_NOT_FOUND: { type: 'error', icon: 'alert' },
    INVALID_PASSWORD: { type: 'error', icon: 'alert' },
    ACCOUNT_PENDING: { type: 'info', icon: 'info' },
    ACCOUNT_REJECTED: { type: 'error', icon: 'alert' },
    DB_UNAVAILABLE: { type: 'warning', icon: 'warning' },
    SERVER_ERROR: { type: 'error', icon: 'alert' },
    NETWORK_ERROR: { type: 'warning', icon: 'warning' },
  };
  return map[code] || { type: 'error', icon: 'alert' };
};

/* ============================================================
   COMPONENT
============================================================ */
const Login = () => {
  const [form, setForm] = useState({ national_id: '', password: '' });
  const [error, setError] = useState({ code: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError({ code: '', message: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ---- Client-side validation ----
    if (!form.national_id && !form.password) {
      setError({
        code: 'MISSING_FIELDS',
        message: 'Please enter both your National ID and password.'
      });
      return;
    }
    if (!form.national_id) {
      setError({
        code: 'MISSING_NATIONAL_ID',
        message: 'Please enter your National ID number.'
      });
      return;
    }
    if (!form.password) {
      setError({
        code: 'MISSING_PASSWORD',
        message: 'Please enter your password.'
      });
      return;
    }

    setLoading(true);
    setError({ code: '', message: '' });

    try {
      const response = await API.post('/auth/login', form);
      const loggedInUser = response.data.user;
      login(loggedInUser, response.data.token);

      const role = String(loggedInUser?.role || '')
        .trim()
        .toLowerCase()
        .replace(/[-\s]+/g, '_');

      const destination = role === 'citizen'
        ? '/dashboard'
        : role === 'home_affairs'
          ? '/home-affairs'
          : role === 'admin'
            ? '/admin'
            : '/officer/dashboard';

      navigate(destination, { replace: true });

    } catch (err) {
      // ---- Network error (no response at all) ----
      if (!err.response) {
        setError({
          code: 'NETWORK_ERROR',
          message: 'Cannot connect to the server. Please check your internet connection and try again.'
        });
        return;
      }

      const { status, data } = err.response;

      // ---- Use backend message if provided ----
      if (data?.message) {
        setError({
          code: data.error || 'SERVER_ERROR',
          message: data.message
        });
        return;
      }

      // ---- Fallback by HTTP status ----
      const fallbackByStatus = {
        400: { code: 'MISSING_FIELDS', message: 'Please check your details and try again.' },
        401: { code: 'INVALID_PASSWORD', message: 'Invalid National ID or password. Please try again.' },
        403: { code: 'ACCOUNT_PENDING', message: 'You do not have permission to log in. Contact Home Affairs.' },
        404: { code: 'USER_NOT_FOUND', message: 'Service not found. Please try again later.' },
        500: { code: 'SERVER_ERROR', message: 'Server error. Please try again in a moment.' },
        503: { code: 'DB_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again shortly.' },
      };
      const fallback = fallbackByStatus[status] || { code: 'SERVER_ERROR', message: 'Login failed. Please try again.' };
      setError(fallback);

    } finally {
      setLoading(false);
    }
  };

  const errorMeta = error.message ? getErrorMeta(error.code) : null;

  return (
    <div className="login-page" style={{ '--page-image': `url("${PAGE_BACKGROUND}")` }}>
      <style>{styles}</style>

      <header className="login-header">
        <div className="login-header__inner">
          <Link to="/" aria-label="Return to MyGov Lesotho home"><Logo /></Link>
          <nav className="login-nav" aria-label="Account navigation">
            <Link to="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#how-it-works">How it works</a>
            <span className="login-nav__divider" />
            <span className="login-nav__prompt">New to MyGov?</span>
            <Link className="button button--outline" to="/register">Create account</Link>
          </nav>
          <button className="mobile-menu" type="button" aria-label="Open menu"><Icon name="menu" /></button>
        </div>
      </header>

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card__avatar"><img src={LESOTHO_LOGO} alt="Lesotho" /></div>
          <h1 id="login-title">Welcome back</h1>
          <p className="login-card__subtitle">Please sign in to your citizen account</p>

          <form onSubmit={handleSubmit} noValidate>

            {/* National ID */}
            <label className="field">
              <span className="field__label">National ID number</span>
              <span className="field__control">
                <span className="field__icon"><Icon name="user" size={18} /></span>
                <input
                  type="text"
                  name="national_id"
                  placeholder="Enter your national ID"
                  value={form.national_id}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            {/* Password */}
            <label className="field">
              <span className="field__label">Password</span>
              <span className="field__control">
                <span className="field__icon"><Icon name="lock" size={18} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPass((value) => !value)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPass ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </span>
            </label>

            <div className="login-options">
              <label><input type="checkbox" /> <span>Remember me</span></label>
              <button type="button" className="forgot-button">Forgot password?</button>
            </div>

            {/* ---- ERROR DISPLAY ---- */}
            {error.message && (
              <div className={`alert alert--${errorMeta.type}`} role="alert">
                <span className="alert__icon"><Icon name={errorMeta.icon} size={16} /></span>
                <span className="alert__message">{error.message}</span>
              </div>
            )}

            <button className="button button--primary button--submit" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : <>Sign in <Icon name="arrow" size={17} /></>}
            </button>

            <div className="divider"><span /> <em>or continue with</em> <span /></div>

            <div className="social-row" aria-label="Social sign in options">
              <button type="button" aria-label="Google sign in">G</button>
              <button type="button" aria-label="Apple sign in">●</button>
              <button type="button" aria-label="Facebook sign in">f</button>
            </div>

            <p className="register-prompt">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </form>
        </section>
      </main>

      <footer className="login-footer">
        <span>© {new Date().getFullYear()} MyGov Lesotho</span>
        <span><Icon name="shield" size={13} /> Secure Government Services Portal</span>
      </footer>
    </div>
  );
};

/* ============================================================
   STYLES
============================================================ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
  :root { --ink:#263249; --green:#008f4c; --green-dark:#006b3a; --muted:#7e8799; --lavender:#eef0fb; --soft-shadow:12px 12px 25px rgba(177,184,207,.55),-12px -12px 25px rgba(255,255,255,.95); --inset-shadow:inset 4px 4px 9px rgba(191,197,218,.35),inset -4px -4px 9px rgba(255,255,255,.85); }
  * { box-sizing:border-box; } body { margin:0; font-family:'DM Sans',sans-serif; color:var(--ink); background:var(--lavender); } button,input { font:inherit; } button { cursor:pointer; }
  .login-page { position:relative; min-height:100vh; display:flex; flex-direction:column; overflow:hidden; background-image:linear-gradient(120deg,rgba(0,40,25,.38),rgba(0,70,55,.25),rgba(0,45,80,.28)),var(--page-image); background-size:cover; background-position:center; background-attachment:fixed; background-repeat:no-repeat; }
  .login-header { position:relative; z-index:2; width:min(1060px,calc(100% - 48px)); height:78px; display:flex; align-items:center; margin:0 auto; }.login-header__inner { width:100%; display:flex; align-items:center; justify-content:space-between; }.login-header a { color:inherit; text-decoration:none; }.brand { display:flex; align-items:center; gap:10px; }.brand__mark { width:37px; height:37px; display:grid; place-items:center; overflow:hidden; border:2px solid rgba(255,255,255,.95); border-radius:50%; background:#fff; box-shadow:5px 5px 12px rgba(188,194,215,.45),-4px -4px 10px rgba(255,255,255,.9); }.brand__mark img { width:100%; height:100%; object-fit:cover; }.brand__copy { display:grid; gap:4px; line-height:1; }.brand__copy strong { color:#253048; font:800 16px/1 'Manrope',sans-serif; }.brand__copy small { color:#fff; font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
  .login-nav { display:flex; align-items:center; gap:22px; }.login-nav a,.login-nav__prompt { color:#000; font-size:14px; font-weight:600; }.login-nav a:hover { color:var(--green); }.login-nav__divider { width:1px; height:18px; background:#d8dce8; }.button { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:11px; font-weight:700; transition:.2s ease; }.button:hover { transform:translateY(-2px); }.button--outline { min-height:37px; padding:0 16px; color:#fff; background:rgba(255,255,255,.48); border:1px solid #dce0eb; box-shadow:5px 5px 10px rgba(188,194,215,.3),-4px -4px 10px rgba(255,255,255,.75); font-size:11px; }.button--outline:hover { color:var(--green); }.button--primary { color:white; background:var(--green); box-shadow:6px 6px 13px rgba(0,143,76,.2); }.button--primary:hover { background:#00a457; }.mobile-menu { display:none; color:#000; background:transparent; border:0; }
  .login-main { position:relative; z-index:1; flex:1; display:grid; place-items:center; padding:15px 18px 45px; }.login-card { width:min(100%,365px); padding:31px 32px 25px; text-align:center; border:1px solid rgba(255,255,255,.82); border-radius:24px; background:rgba(255,255,255,.16); box-shadow:12px 12px 25px rgba(0,0,0,.18),-12px -12px 25px rgba(255,255,255,.18); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }.login-card__avatar { width:73px; height:73px; display:grid; place-items:center; overflow:hidden; margin:0 auto 14px; color:#000; border-radius:50%; background:#eef0fb; box-shadow:7px 7px 14px rgba(187,193,214,.55),-7px -7px 14px rgba(255,255,255,.95); }.login-card__avatar img { width:52px; height:52px; object-fit:cover; border-radius:50%; }.login-card h1 { margin:0; font:800 27px 'Manrope',sans-serif; letter-spacing:-1.2px; }.login-card__subtitle { margin:8px 0 23px; color:#fff; font-size:12px; }.field { display:grid; gap:7px; margin-bottom:13px; text-align:left; }.field__label { color:#fff; font-size:9px; font-weight:700; }.field__control { position:relative; display:flex; align-items:center; }.field__icon { position:absolute; left:13px; z-index:1; display:grid; color:#000; pointer-events:none; }.field input { width:100%; height:45px; padding:0 40px 0 39px; color:#344057; outline:none; border:1px solid rgba(255,255,255,.75); border-radius:11px; background:#eef0fb; box-shadow:var(--inset-shadow); font-size:11px; transition:.2s; }.field input::placeholder { color:rgba(255,255,255,.82); }.field input:focus { border-color:rgba(0,143,76,.38); box-shadow:inset 3px 3px 7px rgba(191,197,218,.3),inset -3px -3px 7px #fff,0 0 0 3px rgba(0,143,76,.08); }.password-toggle { position:absolute; right:7px; display:grid; place-items:center; padding:6px; color:#000; background:transparent; border:0; }.login-options { display:flex; align-items:center; justify-content:space-between; margin:2px 1px 0; color:#fff; font-size:10px; }.login-options label { display:flex; align-items:center; gap:5px; }.login-options input { width:14px; height:14px; accent-color:var(--green); }.forgot-button { padding:0; color:#fff; background:none; border:0; font-size:10px; }
  .button--submit { width:100%; min-height:46px; margin-top:19px; border-radius:11px; font-size:12px; }.button--submit:disabled { cursor:wait; opacity:.68; transform:none; }
  .divider { display:flex; align-items:center; gap:10px; margin:22px 0 16px; }.divider span { flex:1; height:1px; background:#dce0eb; }.divider em { color:#fff; font-size:9px; font-style:normal; white-space:nowrap; }
  .social-row { display:flex; justify-content:center; gap:14px; }.social-row button { width:42px; height:42px; display:grid; place-items:center; color:#000; border:1px solid rgba(255,255,255,.8); border-radius:50%; background:#eef0fb; box-shadow:5px 5px 10px rgba(188,194,215,.42),-5px -5px 10px rgba(255,255,255,.9); font:700 17px 'Manrope',sans-serif; }.social-row button:hover { transform:translateY(-2px); }
  .register-prompt { margin:18px 0 0; color:#fff; font-size:10px; }.register-prompt a { color:var(--green); font-weight:700; text-decoration:none; }
  .login-footer { position:relative; z-index:1; width:min(1060px,calc(100% - 48px)); display:flex; align-items:center; justify-content:space-between; gap:20px; margin:0 auto; padding:15px 0; color:#fff; border-top:1px solid rgba(205,210,226,.8); font-size:9px; }.login-footer span:last-child { display:flex; align-items:center; gap:5px; }

  /* ============================================================
     ALERT STYLES — different colors per error type
  ============================================================ */
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 14px;
    padding: 11px 13px;
    border-radius: 10px;
    font-size: 11px;
    line-height: 1.5;
    text-align: left;
    animation: alertSlide 0.2s ease-out;
  }
  @keyframes alertSlide {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .alert__icon { flex-shrink: 0; margin-top: 1px; display: grid; place-items: center; }
  .alert__message { flex: 1; }

  /* Error — red (wrong credentials, server error) */
  .alert--error {
    color: #a23c3c;
    background: #fbeff0;
    border: 1px solid #f0d8da;
  }
  .alert--error .alert__icon { color: #c53030; }

  /* Warning — amber (missing fields, network, DB down) */
  .alert--warning {
    color: #8a5a00;
    background: #fff8e6;
    border: 1px solid #f5e0a3;
  }
  .alert--warning .alert__icon { color: #b7791f; }

  /* Info — blue (pending verification) */
  .alert--info {
    color: #1e4a80;
    background: #eff6ff;
    border: 1px solid #c7dffc;
  }
  .alert--info .alert__icon { color: #2b6cb0; }

  @media (max-width:700px) {
    .login-header { width:calc(100% - 36px); height:70px; }
    .login-nav { display:none; }
    .mobile-menu { display:block; }
    .login-main { padding-top:15px; }
    .login-card { padding:27px 21px 23px; }
    .login-footer { width:calc(100% - 36px); }
    .login-footer span:last-child { display:none; }
  }
`;

export default Login;