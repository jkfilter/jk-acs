// src/components/ProtectedRoute.jsx
console.log("!!!!!!!!!! PROTECTED ROUTE FILE PARSED BY VITE !!!!!!!!!!"); // لاگ ۱: در سطح ماژول

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, requiredPermission }) => {
    console.log("!!!!!!!!!! ProtectedRoute FUNCTION CALLED !!!!!!!!!! Props:", { requiredPermission }); // لاگ ۲: در ابتدای تابع

    const { isAuthenticated, isAdmin, hasPermission, loadingAuth, user } = useAuth();
    const location = useLocation();

    console.group(`ProtectedRoute Check for path: ${location.pathname} (Timestamp: ${new Date().toLocaleTimeString()})`);
    console.log("Current location object:", location);
    console.log("Is authentication loading (loadingAuth):", loadingAuth);
    console.log("Is user authenticated (isAuthenticated):", isAuthenticated);
    console.log("User object from context:", JSON.stringify(user)); // برای نمایش بهتر آبجکت
    console.log("isAdmin() check result:", isAdmin());
    console.log("Required permission for this route:", requiredPermission);
    if (requiredPermission) {
        console.log(`hasPermission('${requiredPermission}') check result:`, hasPermission(requiredPermission));
    }

    if (loadingAuth) {
        console.log("Decision: Auth is loading. Showing 'loading access' message.");
        console.groupEnd();
        return <div className="p-4 text-center">در حال بررسی دسترسی...</div>;
    }

    if (!isAuthenticated) {
        console.log("Decision: User NOT authenticated. Redirecting to /login.");
        console.groupEnd();
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredPermission) {
        if (isAdmin()) {
            console.log("Decision: User IS admin. Access GRANTED.");
            console.groupEnd();
            return children;
        }
        if (!hasPermission(requiredPermission)) {
            console.error("@@@ PERMISSION DENIED by hasPermission() returning false @@@"); // لاگ خطای مهم
            console.log(`Decision: User IS NOT admin AND LACKS permission '${requiredPermission}'. Redirecting to /.`);
            console.groupEnd();
            return <Navigate to="/" replace />;
        }
    }

    console.log("Decision: Access GRANTED (either no specific permission needed, or non-admin user has the permission).");
    console.groupEnd();
    return children;
};

export default ProtectedRoute;