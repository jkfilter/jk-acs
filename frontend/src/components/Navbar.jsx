//#/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { LayoutDashboard, CircleUserRound, ShieldUser, SquarePower } from 'lucide-react';

const Layout = () => {
  // **تغییر کلیدی:** به جای hasRole از isAdmin استفاده می‌کنیم
  const { isAuthenticated, logout, hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false); // افزودن state برای مدال

  const confirmLogout = async () => {
    setShowLogoutModal(true); // به جای logout مستقیم، ابتدا مدال را باز کن
  };

  const handleLogoutConfirmed = () => {
    logout();
    setShowLogoutModal(false); // بستن مدال بعد از logout
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false); // فقط بستن مدال
  };

  return (
    <div>
      <nav className="min-w-screen bg-gray-200/70 p-2">
        <div className='flex justify-between px-1'>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-xl font-bold text-gray-600 hover:text-blue-500">
              <LayoutDashboard className="w-5 h-5" />
              <span>داشبورد</span>
            </Link>
            
            {/* **شرط نمایش لینک ادمین */}
            {isAdmin() && (
              <Link to="/admin" className="flex items-center bg-violet-700 px-2 py-1 rounded gap-1 text-md text-white hover:bg-violet-500">
                <ShieldUser className="w-5 h-5" />
                <span>داشبورد ادمین</span>
            </Link>
            )}
            
            {!isAuthenticated && (
            <Link to="/login" className="flex items-center bg-gray-50 px-2 py-1 rounded gap-1 text-md text-purple-600 hover:text-purple-400">
              <CircleUserRound className="w-5 h-5" />
              <span>ورود</span>
            </Link>
            )}
          </div>
          <div>
            {isAuthenticated && (
              <button className="flex items-center bg-red-500 text-white px-3 py-1 rounded gap-1 text-md cursor-pointer hover:bg-red-400 " onClick={confirmLogout}>
                <SquarePower className="w-5 h-5" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>

      {/* مدال تایید خروج */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">آیا مطمئن هستید که می‌خواهید خارج شوید؟</h2>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleLogoutConfirmed}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition cursor-pointer"
              >
                خروج
              </button>
              <button
                onClick={handleCancelLogout}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
