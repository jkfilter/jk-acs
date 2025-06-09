import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import DeviceListTabs from './pages/DeviceListTabs.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />

        <Route 
          index 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />

        {/* **تغییر کلیدی:** حالا به جای role، چک می‌کنیم آیا کاربر دسترسی 'admin:manage' را دارد یا نه */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredPermission="admin:manage">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<h3>صفحه مورد نظر یافت نشد!</h3>} />
      
        <Route 
            path="/acs/*" // از * برای مدیریت روت‌های فرزند توسط AcsLayout استفاده می‌کنیم
            element={
                <ProtectedRoute requiredPermission="acs:view_details"> {/* یا acs:view_details اگر آن را ساختید */}
                    <DeviceListTabs />
                </ProtectedRoute>
            } 
        />

        <Route 
            path="acs/device/:deviceId" 
            element={
                <ProtectedRoute requiredPermission="acs:view_details">
                    <DeviceDetailPage />
                </ProtectedRoute>
            } 
        />

      </Route>
    </Routes>
  );
}

export default App;