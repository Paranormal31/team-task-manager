import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  const handleQuickLogin = async (quickEmail) => {
    try {
      await login(quickEmail, '12345');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Enter your credentials to access your workspace
        </p>
        
        {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            Sign In
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--primary)',
          background: 'linear-gradient(145deg, #ffffff, #f0f8f9)',
          boxShadow: '0 2px 10px rgba(77, 182, 172, 0.05)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '20px',
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '1rem',
            boxShadow: '0 2px 5px rgba(77, 182, 172, 0.3)'
          }}>
            🛠️ Testing Feature
          </div>
          
          <button 
            type="button"
            onClick={() => handleQuickLogin('admin1@gmail.com')}
            style={{ 
              width: '100%', 
              marginBottom: '0.75rem', 
              fontSize: '0.85rem', 
              padding: '0.6rem 1rem',
              backgroundColor: 'white',
              color: 'var(--primary)',
              border: '1.5px solid var(--primary)',
              borderRadius: 'var(--radius)',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(77, 182, 172, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            Login as admin 1 (Default Template)
          </button>

          <div style={{ width: '100%' }}>
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  handleQuickLogin(e.target.value);
                }
              }}
              defaultValue=""
              style={{
                width: '100%',
                padding: '0.6rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'white',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              <option value="" disabled>— Quick Login as Any Account —</option>
              <optgroup label="⭐ Admins">
                <option value="admin1@gmail.com">Admin 1 (Default)</option>
                <option value="admin2@gmail.com">Admin 2</option>
                <option value="admin3@gmail.com">Admin 3</option>
              </optgroup>
              <optgroup label="👤 Users">
                <option value="user1@gmail.com">User 1</option>
                <option value="user2@gmail.com">User 2</option>
                <option value="user3@gmail.com">User 3</option>
                <option value="user4@gmail.com">User 4</option>
                <option value="user5@gmail.com">User 5</option>
                <option value="user6@gmail.com">User 6</option>
                <option value="user7@gmail.com">User 7</option>
              </optgroup>
            </select>
          </div>
        </div>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
