import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PAGE_BACKGROUND = '/images/bg1.jfif';
const LESOTHO_LOGO = '/images/lesotho2.jfif';

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.3 18.3 0 0 1-3.1 3.9M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.5-.7" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M13 10h5M13 14h4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M6 3h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L16 13l5 2v3c0 1.1-.9 2-2 2C10.7 20 4 13.3 4 5a2 2 0 0 1 2-2Z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const Logo = () => (
  <div className="brand">
    <span className="brand__mark"><img src={LESOTHO_LOGO} alt="" /></span>
    <span className="brand__copy"><strong>MyGov</strong><small>Lesotho</small></span>
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState('adult');

  const [form, setForm] = useState({
    full_name: '',
    national_id: '',
    username: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.full_name.trim()) return setError('Please enter your full name.');
    if (!form.date_of_birth) return setError('Please enter your date of birth.');
    if (!form.gender) return setError('Please select your gender.');
    if (!form.password || form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    if (tab === 'adult') {
      if (!/^\d{13}$/.test(form.national_id)) {
        return setError('National ID must be exactly 13 digits.');
      }
    } else {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
        return setError('Username must be 3–20 characters: letters, numbers, underscore only.');
      }
    }

    setLoading(true);
    try {
      const payload = {
        account_type: tab,
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        password: form.password,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      if (tab === 'adult') {
        payload.national_id = form.national_id;
      } else {
        payload.username = form.username;
      }

      const response = await API.post('/auth/register', payload);
      const loggedInUser = response.data.user;
      const token = response.data.token;

      login(loggedInUser, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ '--page-image': `url("${PAGE_BACKGROUND}")` }}>
      <style>{styles}</style>

      <header className="register-header">
        <div className="register-header__inner">
          <Link to="/" aria-label="Return to MyGov Lesotho home"><Logo /></Link>
          <nav className="register-nav" aria-label="Account navigation">
            <Link to="/">Home</Link>
            <a href="/#services">Services</a>
            <a href="/#how-it-works">How it works</a>
            <span className="register-nav__divider" />
            <span className="register-nav__prompt">Already registered?</span>
            <button className="button button--outline" onClick={() => navigate('/login')}>Sign in</button>
          </nav>
          <button className="mobile-menu" type="button" aria-label="Open menu"><Icon name="menu" /></button>
        </div>
      </header>

      <main className="register-main">
        <div className="register-shell">
          <section className="register-card" aria-labelledby="register-title">
            <div className="register-card__icon"><img src={LESOTHO_LOGO} alt="Lesotho" /></div>
            <h2 id="register-title">Create your account</h2>
            <p className="register-card__subtitle">
              Choose the option that describes you
            </p>

            {/* TABS */}
            <div className="tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'adult'}
                className={`tab ${tab === 'adult' ? 'active' : ''}`}
                onClick={() => switchTab('adult')}
              >
                <Icon name="id" size={16} />
                <span>I have an ID</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'youth'}
                className={`tab ${tab === 'youth' ? 'active' : ''}`}
                onClick={() => switchTab('youth')}
              >
                <Icon name="user" size={16} />
                <span>I don't have an ID yet</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field full">
                  <span className="field__label">Full name <b>*</b></span>
                  <span className="field__control">
                    <span className="field__icon"><Icon name="user" size={18} /></span>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="e.g. Mpho Thabane"
                      required
                    />
                  </span>
                </label>

                {tab === 'adult' ? (
                  <label className="field full">
                    <span className="field__label">National ID number <b>*</b></span>
                    <span className="field__control">
                      <span className="field__icon"><Icon name="id" size={18} /></span>
                      <input
                        name="national_id"
                        value={form.national_id}
                        onChange={handleChange}
                        placeholder="13 digits"
                        inputMode="numeric"
                        maxLength={13}
                        minLength={13}
                        pattern="[0-9]{13}"
                        title="Enter exactly 13 digits"
                        required
                      />
                    </span>
                  </label>
                ) : (
                  <label className="field full">
                    <span className="field__label">Username <b>*</b></span>
                    <span className="field__control">
                      <span className="field__icon"><Icon name="user" size={18} /></span>
                      <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="e.g. mpho_2010 (3–20 chars)"
                        autoComplete="username"
                        required
                      />
                    </span>
                  </label>
                )}

                <label className="field">
                  <span className="field__label">Date of birth <b>*</b></span>
                  <span className="field__control">
                    <input
                      name="date_of_birth"
                      type="date"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      required
                    />
                  </span>
                </label>

                <label className="field">
                  <span className="field__label">Gender <b>*</b></span>
                  <span className="field__control">
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </span>
                </label>

                <label className="field">
                  <span className="field__label">Email (optional)</span>
                  <span className="field__control">
                    <span className="field__icon"><Icon name="mail" size={18} /></span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </span>
                </label>

                <label className="field">
                  <span className="field__label">Phone (optional)</span>
                  <span className="field__control">
                    <span className="field__icon"><Icon name="phone" size={18} /></span>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 58000000"
                      autoComplete="tel"
                    />
                  </span>
                </label>
              </div>

              <div className="form-divider"><span>Set your password</span></div>

              <div className="form-grid">
                <label className="field">
                  <span className="field__label">Password <b>*</b></span>
                  <span className="field__control">
                    <span className="field__icon"><Icon name="lock" size={18} /></span>
                    <input
                      name="password"
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
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

                <label className="field">
                  <span className="field__label">Confirm password <b>*</b></span>
                  <span className="field__control">
                    <span className="field__icon"><Icon name="lock" size={18} /></span>
                    <input
                      name="confirmPassword"
                      type={showPass ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />
                  </span>
                </label>
              </div>

              {error && (
                <div className="alert alert--error" role="alert">
                  <Icon name="alert" size={15} />
                  <span>{error}</span>
                </div>
              )}

              <button className="button button--primary button--submit" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : <>Create account <Icon name="arrow" size={17} /></>}
              </button>

              <p className="login-prompt">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </form>
          </section>
        </div>
      </main>

      <footer className="register-footer">
        <span>© {new Date().getFullYear()} MyGov Lesotho</span>
        <span>Official Government Services Portal</span>
      </footer>
    </div>
  );
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
  :root { --ink:#263249; --green:#008f4c; --green-dark:#006b3a; --muted:#7e8799; --lavender:#eef0fb; --inset-shadow:inset 4px 4px 9px rgba(191,197,218,.35),inset -4px -4px 9px rgba(255,255,255,.85); }
  * { box-sizing:border-box; } body { margin:0; font-family:'DM Sans',sans-serif; color:var(--ink); background:var(--lavender); } button,input,select { font:inherit; } button { cursor:pointer; }
  .register-page { position:relative; min-height:100vh; display:flex; flex-direction:column; overflow:hidden; color:var(--ink); background-image:linear-gradient(120deg,rgba(0,40,25,.38),rgba(0,70,55,.25),rgba(0,45,80,.28)),var(--page-image); background-size:cover; background-position:center; background-attachment:fixed; background-repeat:no-repeat; }
  .register-header { position:relative; z-index:2; width:min(1060px,calc(100% - 48px)); height:78px; display:flex; align-items:center; margin:0 auto; }
  .register-header__inner { width:100%; display:flex; align-items:center; justify-content:space-between; }
  .register-header a { color:inherit; text-decoration:none; }
  .brand { display:flex; align-items:center; gap:10px; }.brand__mark { width:37px; height:37px; display:grid; place-items:center; overflow:hidden; border:2px solid rgba(255,255,255,.95); border-radius:50%; background:#fff; box-shadow:5px 5px 12px rgba(188,194,215,.45),-4px -4px 10px rgba(255,255,255,.9); }.brand__mark img { width:100%; height:100%; object-fit:cover; }.brand__copy { display:grid; gap:4px; line-height:1; }.brand__copy strong { color:#253048; font:800 16px/1 'Manrope',sans-serif; }.brand__copy small { color:#fff; font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
  .register-nav { display:flex; align-items:center; gap:22px; }.register-nav a,.register-nav__prompt { color:#000; font-size:14px; font-weight:600; }.register-nav a:hover { color:var(--green); }.register-nav__divider { width:1px; height:18px; background:#d8dce8; }.button { display:inline-flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:11px; font-weight:700; transition:transform .2s,box-shadow .2s; }.button:hover { transform:translateY(-2px); }.button--outline { min-height:37px; padding:0 16px; color:#5f687d; background:rgba(255,255,255,.48); border:1px solid #dce0eb; box-shadow:5px 5px 10px rgba(188,194,215,.3),-4px -4px 10px rgba(255,255,255,.75); font-size:11px; }.button--primary { color:#fff; background:var(--green); box-shadow:6px 6px 13px rgba(0,143,76,.2); }.button--primary:hover { background:#00a457; }.mobile-menu { display:none; color:#000; background:transparent; border:0; }
  .register-main { position:relative; z-index:1; flex:1; display:grid; place-items:center; padding:22px 18px 48px; }.register-shell { width:100%; max-width:480px; }
  .register-card { width:100%; padding:29px 31px 25px; text-align:center; border:1px solid rgba(255,255,255,.82); border-radius:24px; background:rgba(255,255,255,.16); box-shadow:12px 12px 25px rgba(0,0,0,.18),-12px -12px 25px rgba(255,255,255,.18); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
  .register-card__icon { width:73px; height:73px; display:grid; place-items:center; overflow:hidden; margin:0 auto 14px; border-radius:50%; background:#eef0fb; box-shadow:7px 7px 14px rgba(187,193,214,.55),-7px -7px 14px rgba(255,255,255,.95); }.register-card__icon img { width:52px; height:52px; object-fit:cover; border-radius:50%; }
  .register-card h2 { margin:0; font:800 27px 'Manrope',sans-serif; letter-spacing:-1.2px; }.register-card__subtitle { margin:8px 0 20px; color:#fff; font-size:12px; }
  .tabs { display:flex; gap:8px; margin-bottom:20px; }.tab { flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 10px; color:#5f687d; border:1px solid rgba(255,255,255,.5); border-radius:11px; background:rgba(255,255,255,.45); font-size:11.5px; font-weight:700; transition:.2s; }.tab:hover { background:rgba(255,255,255,.65); }.tab.active { color:#fff; background:var(--green); border-color:var(--green); box-shadow:6px 6px 13px rgba(0,143,76,.2); }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; text-align:left; }.field { display:grid; gap:6px; }.field.full { grid-column:1/-1; }.field__label { color:#fff; font-size:9px; font-weight:700; }.field__label b { color:#c15d5d; }.field__control { position:relative; display:flex; align-items:center; }.field__icon { position:absolute; left:13px; z-index:1; display:grid; color:#000; pointer-events:none; }.field input,.field select { width:100%; height:43px; padding:0 11px 0 38px; color:#344057; outline:none; border:1px solid rgba(255,255,255,.75); border-radius:11px; background:#eef0fb; box-shadow:var(--inset-shadow); font-size:11px; transition:.2s; }.field select { padding-left:38px; cursor:pointer; appearance:none; }.field input[type="date"] { padding-left:12px; }.field input::placeholder { color:rgba(255,255,255,.82); }.field input:focus,.field select:focus { border-color:rgba(0,143,76,.38); box-shadow:inset 3px 3px 7px rgba(191,197,218,.3),inset -3px -3px 7px #fff,0 0 0 3px rgba(0,143,76,.08); }.password-toggle { position:absolute; right:7px; display:grid; place-items:center; padding:6px; color:#000; background:transparent; border:0; }
  .form-divider { display:flex; align-items:center; gap:10px; margin:19px 0 13px; color:#fff; font-size:8px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; }.form-divider::before,.form-divider::after { flex:1; height:1px; content:''; background:#dce0eb; }
  .alert { display:flex; align-items:center; gap:8px; margin-top:14px; padding:10px 12px; border-radius:10px; font-size:11px; line-height:1.5; text-align:left; }.alert--error { color:#a23c3c; background:#fbeff0; border:1px solid #f0d8da; }
  .button--submit { width:100%; min-height:46px; margin-top:18px; border-radius:11px; font-size:12px; }.button--submit:disabled { cursor:wait; opacity:.68; transform:none; }
  .login-prompt { margin:17px 0 0; color:#fff; font-size:10px; }.login-prompt a { color:var(--green); font-weight:700; text-decoration:none; }
  .register-footer { position:relative; z-index:1; width:min(1060px,calc(100% - 48px)); display:flex; justify-content:space-between; gap:20px; margin:0 auto; padding:15px 0; color:#fff; border-top:1px solid rgba(205,210,226,.8); font-size:9px; }
  @media (max-width:700px) { .register-header { width:calc(100% - 36px); height:70px; }.register-nav { display:none; }.mobile-menu { display:block; }.register-main { padding-top:20px; }.register-card { padding:26px 20px 23px; }.register-footer { width:calc(100% - 36px); }.register-footer span:last-child { display:none; } }
  @media (max-width:430px) { .form-grid { grid-template-columns:1fr; gap:11px; }.field.full { grid-column:auto; }.register-card h2 { font-size:24px; }.register-card__icon { width:66px; height:66px; }.register-card__icon img { width:47px; height:47px; } }
`;

export default Register;