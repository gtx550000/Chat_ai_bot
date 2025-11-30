import React, { useState } from "react";
import '../components/Chatbotlogin.css'; // หรือ path ที่คุณเก็บ css ไว้

// Simple SVG Icons
const Icons = {
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Lock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Mail: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true); // State สำหรับสลับหน้า Login/Signup

  // Toggle Function
  const toggleView = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? 'WELCOME BACK' : 'JOIN THE TEAM'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Enter your credentials to access the AI Core.' 
              : 'Create your account to start building.'}
          </p>
        </div>

        {/* Content Area (สลับด้วย State) */}
        <div className="auth-content fade-in" key={isLogin ? 'login' : 'signup'}>
          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* Username Field (ใช้ทั้ง 2 หน้า) */}
            <div className="form-group">
              <div className="input-wrapper">
                <input type="text" className="auth-input" placeholder="Username" />
                <div className="input-icon"><Icons.User /></div>
              </div>
            </div>

            {/* Gmail Field (เฉพาะหน้า Sign Up) */}
            {!isLogin && (
              <div className="form-group">
                <div className="input-wrapper">
                  <input type="email" className="auth-input" placeholder="Gmail Address" />
                  <div className="input-icon"><Icons.Mail /></div>
                </div>
              </div>
            )}

            {/* Password Field (ใช้ทั้ง 2 หน้า) */}
            <div className="form-group">
              <div className="input-wrapper">
                <input type="password" className="auth-input" placeholder="Password" />
                <div className="input-icon"><Icons.Lock /></div>
              </div>
            </div>

            {/* Forget Password Link (เฉพาะหน้า Login) */}
            {isLogin && (
              <a href="#forget" className="forgot-password">
                Forgot Password?
              </a>
            )}

            {/* Main Action Button */}
            <button className="auth-btn">
              {isLogin ? 'LOG IN >' : 'SIGN UP >'}
            </button>

          </form>

          {/* Toggle Switcher */}
          <div className="toggle-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span className="toggle-link" onClick={toggleView}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;