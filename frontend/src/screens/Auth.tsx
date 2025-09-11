import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { storage } from '../utils/storage';
import { NavigationProps } from '../types';
import '../screens/auth.css';

export default function Auth({ navigation }: NavigationProps) {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const c = document.querySelector('.container');
    if (!c) return;
    if (!isLogin) c.classList.add('active'); else c.classList.remove('active');
  }, [isLogin]);

  async function submit(e?: any) {
    e && e.preventDefault();
    setError(null);
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        const token = result?.token ?? null;
        if (!token) throw new Error('Server did not return a token');
        await storage.setToken(token);
        if (result.user) await storage.setUser(result.user);
        navigation.replace('Users', { token, user: result.user });
      } else {
        const result = await register({ name, email, password });
        const token = result?.token ?? null;
        if (!token) throw new Error('Server did not return a token');
        await storage.setToken(token);
        if (result.user) await storage.setUser(result.user);
        navigation.replace('Users', { token, user: result.user });
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'An error occurred';
      setError(msg);
      console.error('[Auth] submit error', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-outer">
      <div className="container">
        <form className={`form-box ${isLogin ? 'Login' : 'Register'}`} onSubmit={submit}>
          <h2>{isLogin ? 'Login' : 'Register'}</h2>

          {!isLogin && (
            <div className="input-box">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <label>Username</label>
            </div>
          )}

          <div className="input-box">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>

          <div className="input-box">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Password</label>
            <button
              type="button"
              className="btn-show"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn" type="submit">
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>

          <div className="toggle-link">
            <p>
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Sign Up</a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Sign In</a>
                </>
              )}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
