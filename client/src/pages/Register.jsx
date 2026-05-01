import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const avatarFiles = [
    '01.png', '3DDD-1.png', '3DDD-2.png', '3DDD-3.png', '3DDD-4.png', '3DDD.png',
    'Afterclap-1.png', 'Afterclap-2.png', 'Afterclap-3.png', 'Afterclap-4.png', 'Afterclap-5.png', 'Afterclap-6.png',
    'Afterclap-7.png', 'Afterclap-8.png', 'Afterclap-9.png', 'Afterclap.png', 'Cranks-1.png', 'Cranks-2.png',
    'Cranks.png', 'Delivery boy-1.png', 'Delivery boy-2.png', 'Delivery boy-3.png', 'Delivery boy-4.png', 'Delivery boy-5.png',
    'Delivery boy.png', 'E-commerce-1.png', 'E-commerce-2.png', 'E-commerce.png', 'Funny Bunny-1.png', 'Funny Bunny-2.png',
    'Funny Bunny-3.png', 'Funny Bunny-4.png', 'Funny Bunny-5.png', 'Funny Bunny-6.png', 'Funny Bunny-7.png', 'Funny Bunny-8.png',
    'Funny Bunny.png', 'Guacamole-1.png', 'Guacamole-2.png', 'Guacamole-3.png', 'Guacamole.png', 'Juicy-1.png',
    'Juicy.png', 'No comments 3.png', 'No comments 4.png', 'No comments 5.png', 'No comments 6.png', 'No comments 7.png',
    'No comments 8.png', 'No comments 9.png', 'No Comments-1.png', 'No Comments-2.png', 'No Comments-3.png', 'No Comments.png',
    'No gravity-1.png', 'No gravity-2.png', 'No gravity-3.png', 'No gravity.png', 'OSLO-1.png', 'OSLO-10.png',
    'OSLO-11.png', 'OSLO-12.png', 'OSLO-13.png', 'OSLO-14.png', 'OSLO-2.png', 'OSLO-3.png',
    'OSLO-4.png', 'OSLO-5.png', 'OSLO-6.png', 'OSLO-7.png', 'OSLO-8.png', 'OSLO-9.png',
    'OSLO.png', 'Teamwork-1.png', 'Teamwork-2.png', 'Teamwork-3.png', 'Teamwork-4.png', 'Teamwork-5.png',
    'Teamwork-6.png', 'Teamwork-7.png', 'Teamwork-8.png', 'Teamwork.png', 'Upstream-1.png', 'Upstream-10.png',
    'Upstream-11.png', 'Upstream-12.png', 'Upstream-13.png', 'Upstream-14.png', 'Upstream-15.png', 'Upstream-16.png',
    'Upstream-17.png', 'Upstream-2.png', 'Upstream-3.png', 'Upstream-4.png', 'Upstream-5.png', 'Upstream-6.png',
    'Upstream-7.png', 'Upstream-8.png', 'Upstream-9.png', 'Upstream.png'
  ];
  const avatarOptions = avatarFiles.map((file) => `/avatars/${encodeURIComponent(file)}`);
  const avatarsPerPage = 5;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [avatarPage, setAvatarPage] = useState(0);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const totalAvatarPages = Math.ceil(avatarOptions.length / avatarsPerPage);
  const visibleAvatars = avatarOptions.slice(
    avatarPage * avatarsPerPage,
    avatarPage * avatarsPerPage + avatarsPerPage
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, avatar);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Start collaborating with your team today
        </p>
        
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Select Avatar</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 56px)',
                gap: '0.6rem',
                justifyContent: 'space-between'
              }}
            >
              {visibleAvatars.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvatar(option)}
                  aria-label="Select avatar"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    border: avatar === option ? '2px solid var(--primary)' : '2px solid transparent',
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <img
                    src={option}
                    alt="Avatar option"
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
            <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setAvatarPage((p) => Math.max(0, p - 1))}
                disabled={avatarPage === 0}
                aria-label="Previous avatars"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', opacity: avatarPage === 0 ? 0.5 : 1 }}
              >
                ←
              </button>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {avatarPage + 1} / {totalAvatarPages}
              </span>
              <button
                type="button"
                onClick={() => setAvatarPage((p) => Math.min(totalAvatarPages - 1, p + 1))}
                disabled={avatarPage >= totalAvatarPages - 1}
                aria-label="Next avatars"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', opacity: avatarPage >= totalAvatarPages - 1 ? 0.5 : 1 }}
              >
                →
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Create Account
          </button>
        </form>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
