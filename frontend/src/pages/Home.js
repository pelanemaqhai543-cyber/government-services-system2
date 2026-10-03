import React from 'react';
import { useNavigate } from 'react-router-dom';

const PAGE_BACKGROUND = '/images/bg1.jfif';
const LESOTHO_LOGO = '/images/lesotho2.jfif';

const services = [
  {
    icon: 'id',
    title: 'Identity registration',
    department: 'Home Affairs',
    description: 'Register your national identity and keep your citizen details up to date.',
    accent: 'green',
  },
  {
    icon: 'car',
    title: "Driver's licence",
    department: 'Transport',
    description: 'Apply for, renew, or manage your driver’s licence online.',
    accent: 'blue',
  },
  {
    icon: 'wallet',
    title: 'Tax services',
    department: 'Finance',
    description: 'Manage your tax profile, returns, and government payments in one place.',
    accent: 'gold',
  },
  {
    icon: 'users',
    title: 'Pension application',
    department: 'Pensions',
    description: 'Apply for pension benefits and follow the progress of your application.',
    accent: 'purple',
  },
  {
    icon: 'shield',
    title: 'Police clearance',
    department: 'Police',
    description: 'Request an official police clearance certificate securely online.',
    accent: 'red',
  },
  {
    icon: 'passport',
    title: 'Passport services',
    department: 'Home Affairs',
    description: 'Start a passport application or renew your existing travel document.',
    accent: 'teal',
  },
];

const benefits = [
  {
    icon: 'lock',
    title: 'Secure by design',
    description: 'Your account and personal information are protected at every step.',
  },
  {
    icon: 'layers',
    title: 'One citizen profile',
    description: 'Use one account to access services from across government.',
  },
  {
    icon: 'activity',
    title: 'Track progress',
    description: 'Stay informed with clear application updates and notifications.',
  },
  {
    icon: 'globe',
    title: 'Available anywhere',
    description: 'Access essential services online, whenever it suits you.',
  },
];

const Icon = ({ name, size = 20, strokeWidth = 1.8 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    arrowUpRight: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    car: <><path d="m5 17-1-5 2-5h12l2 5-1 5" /><path d="M4 12h16" /><path d="M7 17v2" /><path d="M17 17v2" /><circle cx="7" cy="15" r="1" /><circle cx="17" cy="15" r="1" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M13 10h5M13 14h4" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    passport: <><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 16h8" /></>,
    play: <path d="m9 6 9 6-9 6V6Z" />,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    wallet: <><path d="M3 7h18v13H3z" /><path d="M3 7V5a2 2 0 0 1 2-2h14v4" /><path d="M16 13h5" /><circle cx="16" cy="13" r=".5" fill="currentColor" /></>,
  };

  return <svg {...common}>{paths[name] || paths.spark}</svg>;
};

const Logo = ({ compact = false }) => (
  <div className={`brand ${compact ? 'brand--compact' : ''}`}>
    <span className="brand__mark">
      <img src={LESOTHO_LOGO} alt="" />
    </span>
    <span className="brand__copy">
      <strong>MyGov</strong>
      <small>Lesotho</small>
    </span>
  </div>
);

const Home = () => {
  const navigate = useNavigate();

  const goTo = (path) => navigate(path);

  return (
    <div className="home-page">
      <style>{styles}</style>

      <header className="site-header">
        <div className="container header__inner">
          <a className="brand-link" href="#top" aria-label="MyGov Lesotho home">
            <Logo />
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <a href="#about">About us</a>
          </nav>

          <div className="header__actions">
            <button className="button button--ghost button--small" onClick={() => goTo('/login')}>
              Sign in
            </button>
            <button className="button button--primary button--small" onClick={() => goTo('/register')}>
              Create account <Icon name="arrow" size={16} />
            </button>
          </div>

          <button className="mobile-menu" type="button" aria-label="Open menu">
            <Icon name="menu" size={22} />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" style={{ '--hero-image': `url("${PAGE_BACKGROUND}")` }}>
          <div className="hero__glow hero__glow--one" />
          <div className="hero__glow hero__glow--two" />
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="eyebrow eyebrow--light">
                <span className="eyebrow__dot" />
                Official Government of Lesotho portal
              </div>
              <h1>Government services, <em>made simple.</em></h1>
              <p className="hero__lead">
                One secure place to access the services you need, manage your applications,
                and stay connected with the Government of Lesotho.
              </p>
              <div className="hero__actions">
                <button className="button button--primary button--large" onClick={() => goTo('/register')}>
                  Get started <Icon name="arrow" size={18} />
                </button>
                <a className="text-link text-link--light" href="#how-it-works">
                  <span className="play-icon"><Icon name="play" size={14} /></span>
                  See how it works
                </a>
              </div>
              <div className="hero__trust">
                <span className="trust__avatars" aria-hidden="true">
                  <span>LM</span><span>KT</span><span>RN</span>
                </span>
                <span><strong>Trusted by citizens</strong><br />across the Mountain Kingdom</span>
              </div>
            </div>

            <div className="hero__visual" aria-label="Citizen account preview">
              <div className="hero-card hero-card--back" />
              <div className="hero-card">
                <div className="hero-card__topline">
                  <span className="status-dot"><span /> Live portal</span>
                  <span className="hero-card__menu">•••</span>
                </div>
                <div className="account-heading">
                  <div className="account-avatar"><Icon name="users" size={22} /></div>
                  <div>
                    <span className="muted-label">WELCOME BACK</span>
                    <strong>Your citizen account</strong>
                  </div>
                </div>
                <div className="account-status">
                  <span className="status-check"><Icon name="check" size={14} /></span>
                  <span><strong>Everything is up to date</strong><small>Your profile is secure</small></span>
                  <Icon name="chevron" size={17} />
                </div>
                <div className="card-section-heading">
                  <span>Recent services</span>
                  <a href="#services">View all</a>
                </div>
                <div className="mini-service"><span className="mini-service__icon mini-service__icon--green"><Icon name="id" size={16} /></span><span><strong>Identity registration</strong><small>Completed</small></span><span className="mini-service__date">Today</span></div>
                <div className="mini-service"><span className="mini-service__icon mini-service__icon--blue"><Icon name="passport" size={16} /></span><span><strong>Passport application</strong><small>In review</small></span><span className="mini-service__date">12 Sep</span></div>
                <div className="mini-service"><span className="mini-service__icon mini-service__icon--gold"><Icon name="wallet" size={16} /></span><span><strong>Tax services</strong><small>Ready to view</small></span><span className="mini-service__date">08 Sep</span></div>
                <button className="card-button" onClick={() => goTo('/login')}>Open my dashboard <Icon name="arrow" size={15} /></button>
              </div>
            </div>
          </div>
          <div className="hero__wave" />
        </section>

        <section className="stats-strip" aria-label="Portal benefits">
          <div className="container stats-strip__inner">
            <div><strong>01</strong><span>One secure account</span></div>
            <div><strong>24/7</strong><span>Online access</span></div>
            <div><strong>06+</strong><span>Essential services</span></div>
            <div><strong>100%</strong><span>Built for Lesotho</span></div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <div className="eyebrow"><span className="eyebrow__dot" /> What you can do</div>
                <h2>Essential services.<br /><span>One simple portal.</span></h2>
              </div>
              <p>Find the government service you need and get things done without the queues, paperwork, or guesswork.</p>
            </div>

            <div className="service-grid">
              {services.map((service) => (
                <article className="service-card" key={service.title}>
                  <div className={`service-card__icon service-card__icon--${service.accent}`}><Icon name={service.icon} size={22} /></div>
                  <span className="service-card__department">{service.department}</span>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <a href="#top" className="service-card__link">Explore service <Icon name="arrowUpRight" size={16} /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="workflow section" id="how-it-works">
          <div className="container workflow__inner">
            <div className="workflow__visual">
              <div className="workflow__circle workflow__circle--outer" />
              <div className="workflow__circle workflow__circle--inner" />
              <div className="workflow__badge workflow__badge--top"><span className="workflow__badge-icon"><Icon name="lock" size={16} /></span><span><strong>Secure</strong><small>Your data is protected</small></span></div>
              <div className="workflow__badge workflow__badge--bottom"><span className="workflow__badge-icon workflow__badge-icon--blue"><Icon name="activity" size={16} /></span><span><strong>Always updated</strong><small>Track every application</small></span></div>
              <div className="workflow__center"><Icon name="spark" size={34} /><span>MYGOV<br /><strong>LESOTHO</strong></span></div>
            </div>
            <div className="workflow__content">
              <div className="eyebrow"><span className="eyebrow__dot" /> How it works</div>
              <h2>From sign up to sorted.<br /><span>It’s that easy.</span></h2>
              <p>MyGov brings your essential government services together in a clear, secure, and easy-to-use experience.</p>
              <ol className="steps">
                <li><span className="step-number">01</span><span><strong>Create your account</strong><small>Register once with your basic details.</small></span></li>
                <li><span className="step-number">02</span><span><strong>Choose a service</strong><small>Find the service that matches your needs.</small></span></li>
                <li><span className="step-number">03</span><span><strong>Track your progress</strong><small>Get updates from submission to completion.</small></span></li>
              </ol>
              <button className="button button--dark" onClick={() => goTo('/register')}>Create your account <Icon name="arrow" size={17} /></button>
            </div>
          </div>
        </section>

        <section className="benefits section" id="about">
          <div className="container">
            <div className="section-heading section-heading--center">
              <div className="eyebrow"><span className="eyebrow__dot" /> Why MyGov</div>
              <h2>Designed around <span>you.</span></h2>
              <p>A better way to connect with the services that keep life moving.</p>
            </div>
            <div className="benefits-grid">
              {benefits.map((benefit) => (
                <article className="benefit" key={benefit.title}>
                  <div className="benefit__icon"><Icon name={benefit.icon} size={21} /></div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-section__inner">
            <div className="cta-section__content">
              <div className="eyebrow eyebrow--light"><span className="eyebrow__dot" /> Your services, your way</div>
              <h2>Ready to get started?</h2>
              <p>Create your free MyGov account and experience a simpler way to access government services.</p>
              <div className="cta-section__actions">
                <button className="button button--light button--large" onClick={() => goTo('/register')}>Create free account <Icon name="arrow" size={18} /></button>
                <button className="button button--outline-light button--large" onClick={() => goTo('/login')}>I already have an account</button>
              </div>
            </div>
            <div className="cta-section__mark"><img src={LESOTHO_LOGO} alt="Lesotho" /><span>Government of<br /><strong>Lesotho</strong></span></div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer__top">
          <div className="footer__brand"><Logo compact /><p>Making government services simpler, more accessible, and more connected for everyone in Lesotho.</p></div>
          <div className="footer__links"><div><h3>Portal</h3><a href="#services">Services</a><a href="#how-it-works">How it works</a><a href="#about">About us</a></div><div><h3>Account</h3><button onClick={() => goTo('/login')}>Sign in</button><button onClick={() => goTo('/register')}>Create account</button></div><div><h3>Support</h3><a href="mailto:support@mygov.ls">Contact support</a><a href="#top">Help centre</a></div></div>
        </div>
        <div className="container footer__bottom"><span>© {new Date().getFullYear()} MyGov Lesotho. All rights reserved.</span><span>Official Government Services Portal</span></div>
      </footer>
    </div>
  );
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
  :root { --ink:#10251f; --green:#008f4c; --green-dark:#006b3a; --mint:#e8f5ef; --blue:#2774c6; --gold:#d39b27; --line:#dbe7e1; --muted:#6b7c75; --paper:#fbfdfc; }
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family:'DM Sans',sans-serif; }
  button,a { font:inherit; }
  button { cursor:pointer; }
  .home-page { min-width:320px; overflow:hidden; background:var(--paper); }
  .container { width:min(1160px, calc(100% - 56px)); margin:0 auto; }
  .site-header { position:absolute; z-index:20; inset:0 0 auto; color:white; }
  .header__inner { height:86px; display:flex; align-items:center; justify-content:space-between; gap:32px; border-bottom:1px solid rgba(255,255,255,.17); }
  .brand-link { color:inherit; text-decoration:none; }
  .brand { display:flex; align-items:center; gap:11px; }
  .brand__mark { width:38px; height:38px; display:grid; place-items:center; overflow:hidden; border:2px solid rgba(255,255,255,.9); border-radius:11px; background:white; box-shadow:0 5px 16px rgba(0,0,0,.14); }
  .brand__mark img { width:100%; height:100%; object-fit:cover; }
  .brand__copy { display:grid; line-height:1; gap:5px; }
  .brand__copy strong { font:800 17px/1 'Manrope',sans-serif; letter-spacing:-.5px; }
  .brand__copy small { color:rgba(255,255,255,.72); font-size:10px; letter-spacing:.09em; text-transform:uppercase; }
  .desktop-nav { display:flex; align-items:center; gap:32px; margin-left:auto; }
  .desktop-nav a { color:rgba(255,255,255,.78); font-size:13px; text-decoration:none; transition:color .2s; }
  .desktop-nav a:hover { color:white; }
  .header__actions { display:flex; align-items:center; gap:9px; }
  .button { display:inline-flex; align-items:center; justify-content:center; gap:10px; border:0; border-radius:9px; font-weight:700; transition:transform .2s, box-shadow .2s, background .2s; }
  .button:hover { transform:translateY(-2px); }
  .button--small { min-height:39px; padding:0 17px; font-size:12px; }
  .button--large { min-height:51px; padding:0 22px; font-size:13px; }
  .button--primary { background:var(--green); color:white; box-shadow:0 8px 20px rgba(0,143,76,.2); }
  .button--primary:hover { background:#00a457; box-shadow:0 11px 27px rgba(0,143,76,.3); }
  .button--ghost { color:white; background:transparent; border:1px solid rgba(255,255,255,.38); }
  .button--ghost:hover { background:rgba(255,255,255,.11); }
  .button--dark { color:white; background:var(--ink); min-height:48px; padding:0 19px; font-size:12px; }
  .button--light { background:white; color:var(--green-dark); }
  .button--outline-light { background:transparent; color:white; border:1px solid rgba(255,255,255,.38); }
  .button--outline-light:hover { background:rgba(255,255,255,.1); }
  .mobile-menu { display:none; color:white; background:transparent; border:0; padding:6px; }
  .hero { position:relative; min-height:690px; color:white; isolation:isolate; background-image:linear-gradient(105deg,rgba(5,35,25,.97) 0%,rgba(7,59,39,.84) 43%,rgba(4,41,37,.57) 100%),var(--hero-image); background-size:cover; background-position:center; }
  .hero::after { position:absolute; z-index:-1; content:''; inset:0; background:linear-gradient(180deg,rgba(2,29,20,.28),rgba(3,36,26,.08) 65%,rgba(255,255,255,0)); }
  .hero__glow { position:absolute; z-index:-1; border-radius:50%; filter:blur(3px); opacity:.28; pointer-events:none; }
  .hero__glow--one { width:440px; height:440px; right:4%; top:65px; background:#27a775; filter:blur(100px); }
  .hero__glow--two { width:300px; height:300px; left:-100px; bottom:0; background:#0e7aaf; filter:blur(100px); opacity:.16; }
  .hero__inner { min-height:690px; display:grid; grid-template-columns:1.05fr .95fr; gap:70px; align-items:center; padding-top:78px; }
  .hero__content { padding:35px 0 62px; }
  .eyebrow { display:flex; align-items:center; gap:9px; color:var(--green); font-size:10px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; }
  .eyebrow--light { color:#a6e1c1; }
  .eyebrow__dot { width:7px; height:7px; display:inline-block; border-radius:50%; background:currentColor; box-shadow:0 0 0 4px rgba(0,143,76,.12); }
  .hero h1 { max-width:650px; margin:21px 0 20px; font:800 clamp(43px,5.3vw,69px)/1.04 'Manrope',sans-serif; letter-spacing:-3.8px; }
  .hero h1 em { color:#82dbab; font-style:normal; }
  .hero__lead { max-width:520px; margin:0; color:rgba(255,255,255,.76); font-size:16px; line-height:1.75; }
  .hero__actions { display:flex; align-items:center; gap:24px; margin-top:32px; }
  .text-link { display:inline-flex; align-items:center; gap:10px; font-size:12px; font-weight:700; text-decoration:none; }
  .text-link--light { color:white; }
  .play-icon { width:30px; height:30px; display:grid; place-items:center; color:#79d9a6; border:1px solid rgba(255,255,255,.35); border-radius:50%; }
  .hero__trust { display:flex; align-items:center; gap:12px; margin-top:49px; color:rgba(255,255,255,.59); font-size:10px; line-height:1.5; }
  .hero__trust strong { color:rgba(255,255,255,.9); font-size:11px; }
  .trust__avatars { display:flex; padding-left:6px; }
  .trust__avatars span { width:27px; height:27px; display:grid; place-items:center; margin-left:-6px; border:2px solid #286f55; border-radius:50%; background:#c7e3d3; color:#28654a; font-size:8px; font-weight:800; }
  .trust__avatars span:nth-child(2) { background:#e0c2a3; color:#805d41; }.trust__avatars span:nth-child(3) { background:#c7d7e5; color:#4e6c83; }
  .hero__visual { position:relative; min-height:520px; display:grid; place-items:center; }
  .hero-card { position:relative; width:min(100%,376px); padding:23px; color:var(--ink); border:1px solid rgba(255,255,255,.8); border-radius:18px; background:rgba(255,255,255,.96); box-shadow:0 26px 65px rgba(0,0,0,.23); transform:rotate(2deg); }
  .hero-card--back { position:absolute; width:min(100%,376px); height:420px; transform:rotate(-7deg) translate(-12px,17px); opacity:.2; background:#c6dfd4; border:1px solid rgba(255,255,255,.4); }
  .hero-card__topline,.account-heading,.account-status,.card-section-heading,.mini-service { display:flex; align-items:center; }
  .hero-card__topline { justify-content:space-between; padding-bottom:21px; color:#9ba9a3; font-size:10px; font-weight:700; }
  .status-dot { display:flex; align-items:center; gap:6px; color:var(--green); }.status-dot span { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 0 4px #e2f5ea; }

  .hero-card__menu { letter-spacing:3px; }
  .account-heading { gap:12px; padding-bottom:18px; border-bottom:1px solid #e4ece8; }
  .account-avatar { width:45px; height:45px; display:grid; place-items:center; color:var(--green); border-radius:13px; background:#e4f4eb; }
  .account-heading > div:last-child { display:grid; gap:5px; }.account-heading strong { font:700 13px 'Manrope',sans-serif; }.muted-label { color:#97a49e; font-size:8px; font-weight:700; letter-spacing:.1em; }
  .account-status { gap:9px; margin:18px 0 24px; padding:11px 12px; border:1px solid #d7eedf; border-radius:10px; background:#f1fbf5; }.account-status > span:nth-child(2) { display:grid; flex:1; gap:3px; }.account-status strong { color:#205e3d; font-size:10px; }.account-status small { color:#77a087; font-size:9px; }.status-check { width:24px; height:24px; display:grid; place-items:center; color:white; border-radius:50%; background:var(--green); }.account-status > svg { color:#9aac9f; }
  .card-section-heading { justify-content:space-between; margin-bottom:10px; font:700 11px 'Manrope',sans-serif; }.card-section-heading a { color:var(--green); font-size:9px; text-decoration:none; }
  .mini-service { gap:9px; padding:9px 0; border-bottom:1px solid #edf1ef; }.mini-service > span:nth-child(2) { display:grid; flex:1; gap:3px; }.mini-service strong { color:#263d34; font-size:10px; }.mini-service small { color:#94a39c; font-size:9px; }.mini-service__date { color:#98a69f; font-size:8px; }.mini-service__icon { width:28px; height:28px; display:grid; place-items:center; border-radius:8px; }.mini-service__icon--green { color:#13834d; background:#e7f6ed; }.mini-service__icon--blue { color:#3478bc; background:#e8f2fc; }.mini-service__icon--gold { color:#a5771a; background:#fbf4df; }
  .card-button { width:100%; display:flex; align-items:center; justify-content:center; gap:9px; margin-top:18px; padding:12px; color:white; background:var(--ink); border:0; border-radius:8px; font-size:10px; font-weight:700; }
  .hero__wave { position:absolute; z-index:2; right:-3%; bottom:-1px; left:-3%; height:73px; background:var(--paper); clip-path:ellipse(58% 63% at 50% 100%); }
  .stats-strip { position:relative; z-index:3; margin-top:-1px; background:var(--paper); }.stats-strip__inner { display:grid; grid-template-columns:repeat(4,1fr); padding:26px 0 29px; border-bottom:1px solid var(--line); }.stats-strip__inner > div { display:flex; align-items:center; justify-content:center; gap:12px; border-right:1px solid var(--line); }.stats-strip__inner > div:last-child { border:0; }.stats-strip strong { color:var(--green); font:800 22px 'Manrope',sans-serif; }.stats-strip span { color:var(--muted); font-size:11px; }
  .section { padding:112px 0; }.services-section { background:#fff; }.section-heading h2,.workflow h2,.cta-section h2 { margin:16px 0 0; color:var(--ink); font:800 clamp(34px,4vw,50px)/1.08 'Manrope',sans-serif; letter-spacing:-2.5px; }.section-heading h2 span,.workflow h2 span { color:var(--green); }.section-heading--split { display:grid; grid-template-columns:1.1fr .9fr; align-items:end; gap:80px; margin-bottom:44px; }.section-heading--split > p { max-width:360px; margin:0 0 4px; color:var(--muted); font-size:14px; line-height:1.75; }.service-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; }.service-card { position:relative; min-height:250px; padding:25px; border:1px solid var(--line); border-radius:13px; background:#fff; transition:transform .25s, box-shadow .25s, border-color .25s; }.service-card::before { position:absolute; top:0; right:24px; left:24px; height:2px; content:''; background:var(--card-color,var(--green)); opacity:0; transition:opacity .25s; }.service-card:hover { border-color:#b7d7c6; box-shadow:0 15px 33px rgba(16,67,47,.1); transform:translateY(-5px); }.service-card:hover::before { opacity:1; }.service-card__icon { width:45px; height:45px; display:grid; place-items:center; margin-bottom:17px; border-radius:11px; }.service-card__icon--green { color:#0a8a4d; background:#e7f6ed; --card-color:#0a8a4d; }.service-card__icon--blue { color:#2b75c0; background:#eaf3fc; --card-color:#2b75c0; }.service-card__icon--gold { color:#aa7a1b; background:#faf2dd; --card-color:#aa7a1b; }.service-card__icon--purple { color:#845cb4; background:#f2ebfa; --card-color:#845cb4; }.service-card__icon--red { color:#c15d5d; background:#fbecec; --card-color:#c15d5d; }.service-card__icon--teal { color:#168f91; background:#e6f7f5; --card-color:#168f91; }.service-card__department { display:inline-block; margin-bottom:10px; color:var(--muted); font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }.service-card h3 { margin:0 0 9px; font:700 16px 'Manrope',sans-serif; letter-spacing:-.3px; }.service-card p { min-height:49px; margin:0; color:var(--muted); font-size:11px; line-height:1.65; }.service-card__link { display:flex; align-items:center; gap:6px; margin-top:18px; color:var(--green-dark); font-size:10px; font-weight:700; text-decoration:none; }
  .workflow { background:var(--mint); }.workflow__inner { display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:100px; }.workflow__visual { position:relative; min-height:420px; display:grid; place-items:center; }.workflow__circle { position:absolute; border:1px solid #c5e4d3; border-radius:50%; }.workflow__circle--outer { width:375px; height:375px; }.workflow__circle--inner { width:255px; height:255px; border-color:#add6c2; }.workflow__circle::before,.workflow__circle::after { position:absolute; width:6px; height:6px; content:''; border-radius:50%; background:var(--green); }.workflow__circle::before { top:18%; left:3%; }.workflow__circle::after { right:3%; bottom:19%; background:#4f91cc; }.workflow__center { width:148px; height:148px; display:grid; place-items:center; align-content:center; gap:10px; color:white; border:8px solid #d4ecde; border-radius:50%; background:var(--green); box-shadow:0 18px 35px rgba(0,99,54,.2); font-size:9px; font-weight:700; letter-spacing:.08em; text-align:center; }.workflow__center svg { color:#9be1ba; }.workflow__badge { position:absolute; z-index:2; display:flex; align-items:center; gap:9px; padding:11px 14px 11px 10px; border:1px solid #d9e9e0; border-radius:10px; background:white; box-shadow:0 10px 25px rgba(29,87,59,.1); }.workflow__badge--top { top:41px; right:8px; }.workflow__badge--bottom { bottom:55px; left:1px; }.workflow__badge-icon { width:30px; height:30px; display:grid; place-items:center; color:#168450; border-radius:8px; background:#e5f6eb; }.workflow__badge-icon--blue { color:#397dbd; background:#e9f2fb; }.workflow__badge strong,.workflow__badge small { display:block; }.workflow__badge strong { margin-bottom:4px; font-size:10px; }.workflow__badge small { color:var(--muted); font-size:8px; }.workflow__content > p { max-width:430px; margin:20px 0 28px; color:var(--muted); font-size:14px; line-height:1.75; }.steps { display:grid; gap:19px; padding:0; margin:0 0 30px; list-style:none; }.steps li { display:flex; align-items:flex-start; gap:16px; }.step-number { color:var(--green); font:700 11px 'Manrope',sans-serif; }.steps li > span:last-child { display:grid; gap:4px; }.steps strong { font-size:12px; }.steps small { color:var(--muted); font-size:10px; }.workflow .button--dark:hover { background:var(--green-dark); }
  .benefits { background:#fff; }.section-heading--center { max-width:600px; margin:0 auto 47px; text-align:center; }.section-heading--center .eyebrow { justify-content:center; }.section-heading--center p { margin:17px 0 0; color:var(--muted); font-size:14px; }.benefits-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:15px; }.benefit { padding:24px 22px; border:1px solid var(--line); border-radius:13px; }.benefit__icon { width:39px; height:39px; display:grid; place-items:center; margin-bottom:18px; color:var(--green); border-radius:10px; background:var(--mint); }.benefit h3 { margin:0 0 8px; font:700 14px 'Manrope',sans-serif; }.benefit p { margin:0; color:var(--muted); font-size:11px; line-height:1.65; }
  .cta-section { position:relative; overflow:hidden; color:white; background:var(--green-dark); }.cta-section::before { position:absolute; width:550px; height:550px; right:-90px; top:-220px; content:''; border:1px solid rgba(255,255,255,.1); border-radius:50%; box-shadow:0 0 0 50px rgba(255,255,255,.025),0 0 0 100px rgba(255,255,255,.025); }.cta-section__inner { min-height:320px; display:flex; align-items:center; justify-content:space-between; gap:40px; padding-top:70px; padding-bottom:70px; }.cta-section h2 { color:white; font-size:43px; }.cta-section__content > p { max-width:480px; margin:15px 0 24px; color:rgba(255,255,255,.68); font-size:14px; line-height:1.7; }.cta-section__actions { display:flex; flex-wrap:wrap; gap:10px; }.cta-section__mark { position:relative; z-index:1; display:flex; align-items:center; gap:15px; color:rgba(255,255,255,.78); font-size:11px; line-height:1.5; }.cta-section__mark img { width:70px; height:70px; object-fit:cover; border:3px solid rgba(255,255,255,.75); border-radius:50%; }.cta-section__mark strong { color:white; font:700 16px 'Manrope',sans-serif; }
  .site-footer { color:#b5c4bd; background:#10251f; }.footer__top { display:flex; justify-content:space-between; gap:70px; padding-top:54px; padding-bottom:47px; }.footer__brand { max-width:290px; }.footer__brand .brand__mark { border-color:#5ba982; }.footer__brand .brand__copy strong { color:white; }.footer__brand p { margin:19px 0 0; color:#7f958b; font-size:11px; line-height:1.7; }.footer__links { display:flex; gap:76px; }.footer__links > div { display:grid; align-content:start; gap:12px; min-width:105px; }.footer__links h3 { margin:0 0 5px; color:#81d7a8; font-size:9px; letter-spacing:.13em; text-transform:uppercase; }.footer__links a,.footer__links button { width:max-content; padding:0; color:#9eb2a8; background:transparent; border:0; font-size:11px; text-decoration:none; }.footer__links a:hover,.footer__links button:hover { color:white; }.footer__bottom { display:flex; justify-content:space-between; gap:20px; padding:17px 0; border-top:1px solid rgba(255,255,255,.1); color:#6e857a; font-size:9px; }
  @media (max-width:900px) { .container { width:min(100% - 40px,650px); }.desktop-nav { display:none; }.mobile-menu { display:block; }.header__actions { margin-left:auto; }.hero__inner { grid-template-columns:1fr; gap:0; padding-top:125px; }.hero__content { padding:20px 0 20px; text-align:center; }.hero h1 { margin-right:auto; margin-left:auto; }.hero__lead { margin-right:auto; margin-left:auto; }.hero__actions,.hero__trust { justify-content:center; }.hero__visual { min-height:480px; }.section-heading--split { grid-template-columns:1fr; gap:18px; }.service-grid { grid-template-columns:repeat(2,1fr); }.workflow__inner { grid-template-columns:1fr; gap:45px; }.workflow__visual { min-height:350px; }.workflow__content { text-align:center; }.workflow__content .eyebrow { justify-content:center; }.workflow__content > p { margin-right:auto; margin-left:auto; }.steps { text-align:left; width:min(100%,430px); margin-right:auto; margin-left:auto; }.benefits-grid { grid-template-columns:repeat(2,1fr); }.cta-section__inner { align-items:flex-start; }.cta-section__mark { display:none; }.footer__top { gap:45px; }.footer__links { gap:35px; } }
  @media (max-width:600px) { .container { width:calc(100% - 36px); }.header__inner { height:72px; }.header__actions .button--ghost { display:none; }.brand__copy strong { font-size:15px; }.hero { min-height:790px; }.hero__inner { min-height:790px; padding-top:100px; }.hero h1 { font-size:43px; letter-spacing:-2.4px; }.hero__lead { font-size:14px; }.hero__actions { flex-direction:column; gap:17px; }.hero__trust { margin-top:33px; }.hero__visual { min-height:425px; transform:scale(.89); }.hero-card,.hero-card--back { max-width:355px; }.hero__wave { height:42px; }.stats-strip__inner { grid-template-columns:repeat(2,1fr); gap:18px 0; padding:23px 0; }.stats-strip__inner > div:nth-child(2) { border:0; }.stats-strip span { font-size:10px; }.section { padding:76px 0; }.section-heading h2,.workflow h2 { font-size:35px; letter-spacing:-1.8px; }.service-grid { grid-template-columns:1fr; }.service-card { min-height:0; }.service-card p { min-height:0; }.workflow__visual { transform:scale(.8); margin:-30px 0; }.workflow__badge--top { right:-5px; }.workflow__badge--bottom { left:-5px; }.benefits-grid { grid-template-columns:1fr; }.section-heading--center { margin-bottom:34px; }.cta-section__inner { padding-top:58px; padding-bottom:58px; }.cta-section h2 { font-size:36px; }.cta-section__actions { flex-direction:column; align-items:stretch; }.footer__top { flex-direction:column; padding-top:42px; padding-bottom:35px; }.footer__links { justify-content:space-between; gap:18px; }.footer__bottom { flex-direction:column; gap:8px; }.footer__bottom span:last-child { display:none; } }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; } }
`;

export default Home;
