//#/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom'; // Navigate را اضافه کنید
import useAuth from '../hooks/useAuth';
import { ScanFace } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- این بخش کلیدی و جدید است ---
  // اگر کاربر از قبل احراز هویت شده، او را به صفحه اصلی هدایت کن
  if (auth.isAuthenticated) {
    // از کامپوننت Navigate برای ریدایرکت استفاده می‌کنیم
    return <Navigate to="/" replace />;
  }
  // ------------------------------------

  const from = location.state?.from?.pathname || "/";

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await auth.login(username, password);
    navigate(from, { replace: true });
  } catch (err) {
    console.error("Login error:", err);
    setError('نام کاربری یا رمز عبور اشتباه است.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="home-div">
      <div className="backdrop-blur-sm bg-white/20 rounded-xl p-8 w-full max-w-md shadow-xl border border-purple-300/70">
        <form onSubmit={handleSubmit} className='text-center'>
          <h2 className="inline-flex items-center justify-center gap-1 text-2xl font-bold text-purple-700 mb-6">
            <ScanFace className="w-6 h-6"  strokeWidth={2.5}/>
            ورود به سامانه
            </h2>
          <input
            type="text"
            placeholder="نام کاربری"
            className="w-full border border-gray-300 p-2 rounded mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="رمز عبور"
            className="w-full border border-gray-300 p-2 rounded mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded font-semibold cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
          <div className="text-red-500 my-4 text-center">{error}</div>
        </form>
      </div>




    </div>
  );
};

export default LoginPage;