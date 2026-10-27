import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name, size = 18 }) => {
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const p = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  };
  return <svg {...c}>{p[name]}</svg>;
};

const styles = `
  .profile-page { --blue:#00209F; --blue-dark:#00166f; --blue-soft:#edf2ff; --green:#009543; --green-dark:#007936; --green-soft:#eaf8f0; --black:#000; --ink:#172235; --muted:#718096; --border:#e5e9f0; --white:#fff; max-width:900px; margin:0 auto; color:var(--ink); }
  .profile-page * { box-sizing:border-box; }
  .profile-page h1, .profile-page h2, .profile-page h3, .profile-page p { margin:0; }
  .profile-page button { font:inherit; cursor:pointer; }
  .profile-page .hero { margin-bottom:26px; }
  .profile-page .eyebrow { display:flex; align-items:center; gap:9px; margin-bottom:9px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; }
  .profile-page .eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 5px var(--green-soft); }
  .profile-page h1 { color:var(--black); font-size:clamp(25px,3vw,32px); letter-spacing:-.04em; }
  .profile-page .hero p { margin-top:9px; color:var(--muted); font-size:14px; }

  .profile-page .card { background:#fff; border:1px solid var(--border); border-radius:16px; padding:26px 28px; margin-bottom:20px; box-shadow:0 7px 20px rgba(20,35,60,.04); }
  .profile-page .card-title { font-size:15px; font-weight:800; color:var(--black); margin-bottom:6px; }
  .profile-page .card-sub { font-size:12.5px; color:var(--muted); margin-bottom:20px; line-height:1.55; }

  .profile-page .picture-row { display:flex; align-items:center; gap:22px; flex-wrap:wrap; }
  .profile-page .avatar-wrap { position:relative; }
  .profile-page .avatar { width:110px; height:110px; border-radius:50%; background:var(--blue); color:#fff; display:grid; place-items:center; font-size:42px; font-weight:900; overflow:hidden; border:4px solid #fff; box-shadow:0 4px 16px rgba(20,35,60,.1); }
  .profile-page .avatar img { width:100%; height:100%; object-fit:cover; }
  .profile-page .lock-badge { position:absolute; right:2px; bottom:2px; width:32px; height:32px; display:grid; place-items:center; background:var(--black); color:#fff; border:3px solid #fff; border-radius:50%; }
  .profile-page .picture-info { flex:1; min-width:220px; }
  .profile-page .picture-info h3 { font-size:15px; margin-bottom:6px; }
  .profile-page .picture-info p { font-size:12.5px; color:var(--muted); line-height:1.6; margin-bottom:14px; }
  .profile-page .picture-actions { display:flex; gap:10px; flex-wrap:wrap; }
  .profile-page .btn { display:inline-flex; align-items:center; gap:8px; padding:11px 18px; border-radius:10px; font-size:13px; font-weight:800; border:1px solid transparent; transition:.2s; }
  .profile-page .btn-primary { background:var(--blue); color:#fff; border-color:var(--blue); }
  .profile-page .btn-primary:hover { background:var(--blue-dark); }
  .profile-page .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .profile-page .btn-secondary { background:#fff; color:var(--blue); border-color:#cbd6f2; }
  .profile-page .btn-secondary:hover { background:var(--blue-soft); }

  .profile-page .locked-note { display:flex; gap:12px; padding:18px 20px; background:#fff8e6; border-left:4px solid #b7791f; border-radius:8px; color:#8a5a00; font-size:13px; line-height:1.65; margin-top:20px; }
  .profile-page .locked-note svg { flex:0 0 auto; margin-top:2px; color:#b7791f; }
  .profile-page .locked-note strong { font-weight:800; display:block; margin-bottom:4px; color:#704100; font-size:13.5px; }

  .profile-page .picture-restriction { margin-top:20px; padding:14px 16px; background:#eff6ff; border-left:4px solid #2563eb; border-radius:8px; color:#1e3a8a; font-size:12.5px; line-height:1.6; display:flex; gap:10px; }
  .profile-page .picture-restriction svg { flex:0 0 auto; margin-top:1px; }

  .profile-page .upload-box { border:2px dashed #cbd5e1; border-radius:12px; padding:28px 20px; text-align:center; cursor:pointer; transition:.2s; background:#fbfcff; display:block; }
  .profile-page .upload-box:hover { border-color:var(--blue); background:var(--blue-soft); }
  .profile-page .upload-box svg { color:var(--blue); margin-bottom:10px; }
  .profile-page .upload-box p { font-size:13.5px; color:var(--ink); font-weight:800; }
  .profile-page .upload-box small { font-size:11.5px; color:var(--muted); }

  .profile-page .field-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  .profile-page .field { display:flex; flex-direction:column; gap:6px; }
  .profile-page .field.full { grid-column:1 / -1; }
  .profile-page .field label { font-size:11.5px; font-weight:800; color:var(--ink); }
  .profile-page .field input { padding:11px 13px; border:1px solid var(--border); border-radius:10px; font-size:13px; background:#f7f9fc; color:var(--muted); outline:none; cursor:not-allowed; }

  .profile-page .alert { padding:14px 16px; border-radius:10px; font-size:13px; line-height:1.55; margin-bottom:16px; display:flex; gap:10px; align-items:flex-start; }
  .profile-page .alert-error { background:#fbeff0; color:#a23c3c; border:1px solid #f0d8da; }.profile-page .alert svg { flex:0 0 auto; margin-top:1px; }
  .profile-page .alert-success { background:#eaf8f0; color:#007936; border:1px solid #bfe4cf; }

  .profile-main { min-width:0; width:calc(100% - 240px); min-height:100vh; margin-left:240px; padding:32px 40px; }
  @media (max-width:700px) { .profile-main { width:100%; margin-left:0; padding:22px 16px 32px; } .profile-page .field-grid { grid-template-columns:1fr; } .profile-page .field.full { grid-column:auto; } }

.profile-page{padding-bottom:35px}
.profile-page .hero{position:relative;overflow:hidden;padding:30px 32px;margin-bottom:24px;border:1px solid #00166f;border-radius:22px;background:linear-gradient(118deg,#00145f 0%,#00209f 58%,#003dbb 100%);box-shadow:0 18px 40px rgba(0,32,159,.18)}
.profile-page .hero:after{position:absolute;right:-88px;bottom:-132px;width:320px;height:320px;content:'';border:45px solid rgba(0,149,67,.34);border-radius:50%}
.profile-page .hero>*{position:relative;z-index:1}
.profile-page .hero .eyebrow{color:#baf2cf}
.profile-page .hero .eyebrow span{background:#20c778;box-shadow:0 0 0 5px rgba(32,199,120,.2)}
.profile-page .hero h1{color:#fff;font-size:clamp(28px,3.2vw,42px);letter-spacing:-.055em}
.profile-page .hero p{color:rgba(255,255,255,.78);max-width:650px}
.profile-page .card{position:relative;overflow:hidden;box-shadow:0 11px 28px rgba(20,35,60,.07)}
.profile-page .card:before{position:absolute;top:0;left:0;right:0;height:4px;content:'';background:#00209f}
.profile-page .card:nth-of-type(3):before{background:#009543}
.profile-page .card-title{font-size:17px;letter-spacing:-.025em}
.profile-page .picture-row{padding:4px 0 8px}
.profile-page .avatar{width:118px;height:118px;border:5px solid #fff;box-shadow:0 0 0 4px #dce6ff,0 10px 22px rgba(0,32,159,.15);background:#00209f}
.profile-page .lock-badge{background:#000;box-shadow:0 3px 7px rgba(0,0,0,.2)}
.profile-page .picture-info h3{font-size:18px;color:#000}
.profile-page .picture-info p{max-width:520px}
.profile-page .btn{box-shadow:0 5px 12px rgba(20,35,60,.06)}
.profile-page .btn-primary{background:#00209f;box-shadow:0 7px 15px rgba(0,32,159,.16)}
.profile-page .btn-primary:hover{background:#009543;border-color:#009543}
.profile-page .upload-box{border-color:#aebfdf;background:linear-gradient(135deg,#fbfcff,#f1f5ff)}
.profile-page .upload-box:hover{border-color:#009543;background:#effaf4}
.profile-page .locked-note{border-left-color:#009543;background:linear-gradient(100deg,#edf8f1,#fff8e6);box-shadow:0 8px 20px rgba(20,35,60,.05)}
.profile-page .locked-note svg{color:#009543}
.profile-page .picture-restriction{border-left-color:#00209f;background:linear-gradient(100deg,#edf2ff,#f4f7ff);color:#1e3a8a}
.profile-page .field input{border-color:#dbe2ee;background:#f8faff}
@media(max-width:600px){.profile-page .hero{padding:24px 20px}.profile-page .card{padding:21px 18px}}
`;

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [picture, setPicture] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshProfile = async () => {
    try {
      const res = await API.get('/citizen/profile');
      setProfile(res.data);
      if (user) {
        login({ ...user, picture_data: res.data.picture_data }, localStorage.getItem('token'));
      }
    } catch {
      setError('Unable to load profile.');
    }
  };

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, []);

  const handlePictureSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Picture must be under 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPicture(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleUploadPicture = async () => {
    if (!picture) {
      setError('Please select a picture first.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.put('/citizen/profile-picture', {
        picture_url: picture,
      });
      setSuccess(res.data.message || 'Profile picture saved. It cannot be changed again.');
      setPicture(null);
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save picture.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.full_name || user?.full_name || 'Citizen';
  const initial = displayName.charAt(0).toUpperCase();
  const currentPicture = profile?.picture_data || user?.picture_data;
  const alreadyHasPicture = Boolean(currentPicture || profile?.picture_locked || profile?.picture_locked_at);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fc' }}>
      <Sidebar />
      <main className="profile-main">
        <style>{styles}</style>
        <div className="profile-page">
          <header className="hero">
            <div className="eyebrow"><span /> My account</div>
            <h1>Profile</h1>
            <p>Manage your account information. Your profile picture can only be uploaded once.</p>
          </header>

          {/* PICTURE CARD */}
          <section className="card">
            <div className="card-title">Profile picture</div>
            <div className="card-sub">
              {alreadyHasPicture
                ? 'Your profile picture is permanently locked. It cannot be changed from the portal.'
                : 'Upload your profile picture once. After it is saved, it cannot be changed.'}
            </div>

            <div className="picture-row">
              <div className="avatar-wrap">
                <div className="avatar">
                  {(picture || currentPicture)
                    ? <img src={picture || currentPicture} alt="Profile" />
                    : initial}
                </div>
                {alreadyHasPicture && (
                  <div className="lock-badge" title="Locked"><Icon name="lock" size={14} /></div>
                )}
              </div>

              <div className="picture-info">
                <h3>{displayName}</h3>
                <p>
                  {alreadyHasPicture
                    ? 'Your picture is saved and cannot be changed. To request an update, visit a Home Affairs office in person with valid identification.'
                    : 'Choose a clear photo of yourself. It will be saved permanently after upload.'}
                </p>

                {!alreadyHasPicture && (
                  <div className="picture-actions">
                    <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                      <Icon name="camera" size={14} />
                      {picture ? 'Choose different' : 'Choose photo'}
                      <input type="file" accept="image/*" hidden onChange={handlePictureSelect} />
                    </label>
                    {picture && (
                      <button className="btn btn-primary" onClick={handleUploadPicture} disabled={saving}>
                        {saving ? 'Saving...' : 'Save picture (permanent)'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Upload zone — only if no picture yet and none picked */}
            {!alreadyHasPicture && !picture && (
              <label className="upload-box" style={{ marginTop: 20 }}>
                <input type="file" accept="image/*" hidden onChange={handlePictureSelect} />
                <Icon name="camera" size={32} />
                <p>Click to upload your photo</p>
                <small>JPG, PNG · Max 5MB · Can only be set once</small>
              </label>
            )}

            {error && <div className="alert alert-error" style={{ marginTop: 16 }}><Icon name="info" size={16} /> <span>{error}</span></div>}
            {success && <div className="alert alert-success" style={{ marginTop: 16 }}><Icon name="lock" size={16} /> <span>{success}</span></div>}

            {alreadyHasPicture && (
              <div className="picture-restriction">
                <Icon name="info" size={16} />
                <div>
                  <strong>Why can't I change it?</strong><br/>
                  Your picture is now a verified government record tied to your identity. Changing it is not allowed through the portal to prevent fraud. Contact Home Affairs if you have a genuine need.
                </div>
              </div>
            )}
          </section>

          {/* HOW TO CHANGE */}
          {alreadyHasPicture && (
            <div className="locked-note">
              <Icon name="lock" size={18} />
              <div>
                <strong>Need to update your picture?</strong>
                Visit any Home Affairs office with:
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
                  <li>Your National ID or account username</li>
                  <li>Any supporting identification</li>
                  <li>A valid reason for the change</li>
                </ul>
              </div>
            </div>
          )}

          {/* ACCOUNT INFO */}
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-title">Account information</div>
            <div className="card-sub">This information is tied to your MyGov account and cannot be edited from here.</div>

            {loading ? (
              <p style={{ color: '#718096', fontSize: 13 }}>Loading…</p>
            ) : (
              <div className="field-grid">
                <div className="field"><label>Full name</label><input value={displayName} readOnly /></div>
                <div className="field"><label>Account type</label><input value={profile?.account_type === 'youth' ? 'Youth (no ID yet)' : 'Adult (with National ID)'} readOnly /></div>
                <div className="field"><label>National ID</label><input value={profile?.national_id || 'Not linked'} readOnly /></div>
                <div className="field"><label>Username</label><input value={profile?.username || 'Not set'} readOnly /></div>
                <div className="field"><label>Email</label><input value={profile?.email || '—'} readOnly /></div>
                <div className="field"><label>Phone</label><input value={profile?.phone || '—'} readOnly /></div>
                <div className="field"><label>Date of birth</label><input value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : '—'} readOnly /></div>
                <div className="field"><label>Gender</label><input value={profile?.gender || '—'} readOnly /></div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;