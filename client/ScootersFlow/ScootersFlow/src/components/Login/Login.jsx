import React, { useState } from 'react';
import './Login.css';
import logoImg from './Logo/logoImg.png'; 

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/workers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('שם משתמש או סיסמה שגויים');

      const data = await response.json(); 
      
      localStorage.setItem('id', data.id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);

      // עדכון המצב ב-App.js
      if (onLogin) {
        onLogin({ name: data.name, role: data.role });
      }
      
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'אין תקשורת עם השרת' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-side">
        <div className="login-content">
          <div className="login-logo-wrapper">
            <img src={logoImg} alt="ScooterFlow" className="login-logo-img" />
          </div>
          
          <h1 className="login-main-title">כניסה למערכת</h1>
          <p className="login-desc">הזן שם משתמש וסיסמה להמשך עבודה</p>
          
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label>שם משתמש</label>
              <input
                type="text"
                name="username"
                className="input-ctrl"
                value={credentials.username}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label>סיסמה</label>
              <input
                type="password"
                name="password"
                className="input-ctrl"
                value={credentials.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" disabled={isLoading} className="submit-btn">
              {isLoading ? 'מתחבר...' : 'התחברות'}
            </button>
          </form>
        </div>
      </div>

      <div className="login-visual-side"></div>
    </div>
  );
};

export default Login;