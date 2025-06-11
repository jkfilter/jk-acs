//#/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const permissionTranslations = {
    'admin:manage': 'مدیریت ادمین',
    'olt:read': 'مشاهده OLT',
    'olt:write': 'ویرایش OLT',
    'modem:configure': 'تنظیم مودم',
    // سایر ترجمه‌ها را به دلخواه اضافه کنید
};

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [message, setMessage] = useState('');
    const [newUser, setNewUser] = useState({ username: '', password: '' });
    const [editingPassword, setEditingPassword] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchPermissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await apiClient.get('/admin/users/');
            setUsers(response.data);
        } catch (error) {
            setMessage(`خطا در دریافت کاربران: ${error.response?.data?.detail || error.message}`);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await apiClient.get('/admin/permissions/');
            setPermissions(response.data);
        } catch (error) {
            setMessage(`خطا در دریافت دسترسی‌ها: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/admin/users/', newUser);
            setMessage(`کاربر ${newUser.username} با موفقیت ساخته شد.`);
            setNewUser({ username: '', password: '' });
            fetchUsers();
        } catch (error) {
            setMessage(`خطا در ساخت کاربر: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleAssignPermission = async (userId, permissionId) => {
        try {
            await apiClient.post(`/admin/users/${userId}/permissions/${permissionId}`);
            setMessage('دسترسی با موفقیت به کاربر اختصاص داده شد.');
            fetchUsers();
        } catch (error) {
            setMessage(`خطا در اختصاص دسترسی: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleRemovePermission = async (userId, permissionId) => {
        try {
            await apiClient.delete(`/admin/users/${userId}/permissions/${permissionId}`);
            setMessage('دسترسی با موفقیت از کاربر حذف شد.');
            fetchUsers();
        } catch (error) {
            setMessage(`خطا در حذف دسترسی: ${error.response?.data?.detail || error.message}`);
        }
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await apiClient.delete(`/admin/users/${userToDelete.id}`);
            setMessage(`کاربر ${userToDelete.username} با موفقیت حذف شد.`);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            setMessage(`خطا در حذف کاربر: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleChangePassword = async (e, userId) => {
        e.preventDefault();
        try {
            await apiClient.put(`/admin/users/${userId}/password`, { new_password: newPassword });
            setMessage('رمز عبور با موفقیت تغییر کرد.');
            setEditingPassword(null);
            setNewPassword('');
        } catch (error) {
            setMessage(`خطا در تغییر رمز عبور: ${error.response?.data?.detail || error.message}`);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-purple-800 mb-4">داشبورد ادمین</h1>
            {message && <p className="mb-4 text-green-600 font-semibold">{message}</p>}

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">ساخت کاربر جدید</h2>
                <form onSubmit={handleCreateUser} className="flex gap-4 flex-wrap">
                    <input type="text" placeholder="نام کاربری جدید" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required className="p-2 border rounded w-64" />
                    <input type="password" placeholder="رمز عبور" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required className="p-2 border rounded w-64" />
                    <button type="submit" className="bg-purple-600 text-white p-2 rounded cursor-pointer">ساخت کاربر</button>
                </form>
            </div>

            <h2 className="text-xl font-semibold mb-2">لیست کاربران</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-400">
                    <thead className="bg-purple-100">
                        <tr>
                            <th className="p-2 border border-gray-400">ID</th>
                            <th className="p-2 border border-gray-400">نام کاربری</th>
                            <th className="p-2 border border-gray-400">رمز عبور</th>
                            <th className="p-2 border border-gray-400">دسترسی‌ها</th>
                            <th className="p-2 border border-gray-400">دسترسی جدید</th>
                            <th className="p-2 border border-gray-400">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="text-center">
                                <td className="p-2 border border-gray-400">{user.id}</td>
                                <td className="p-2 border border-gray-400">{user.username}</td>
                                <td className="p-2 border border-gray-400">
                                    {editingPassword === user.id ? (
                                        <form onSubmit={(e) => handleChangePassword(e, user.id)} className="flex gap-2 justify-center">
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border rounded px-2 py-1" placeholder="رمز جدید" autoFocus />
                                            <button type="submit" className="text-white bg-green-500 px-2 rounded cursor-pointer">ذخیره</button>
                                            <button type="button" onClick={() => setEditingPassword(null)} className="text-white bg-gray-400 px-2 rounded cursor-pointer">لغو</button>
                                        </form>
                                    ) : (
                                        <button onClick={() => { setEditingPassword(user.id); setNewPassword(''); }} className="text-white bg-blue-500 px-2 py-1 rounded cursor-pointer">تغییر</button>
                                    )}
                                </td>
                                <td className="p-2 border border-gray-400">
                                    {user.permissions.length > 0 ? user.permissions.map(p => (
                                        <span key={p.id} className="inline-flex items-center gap-1 m-1 px-2 py-1 bg-purple-100 rounded cursor-pointer">
                                            {permissionTranslations[p.name] || p.name}
                                            <button onClick={() => handleRemovePermission(user.id, p.id)} className="text-red-500 font-bold cursor-pointer">×</button>
                                        </span>
                                    )) : 'هیچ'}
                                </td>
                                <td className="p-2 border border-gray-400">
                                    {!user.is_admin && permissions.map(permission => (
                                        permission.name !== 'admin:manage' &&
                                        !user.permissions.some(up => up.id === permission.id) && (
                                            <button key={permission.id} onClick={() => handleAssignPermission(user.id, permission.id)} className="bg-purple-200 m-1 px-2 py-1 rounded cursor-pointer">
                                                افزودن {permissionTranslations[permission.name] || permission.name}
                                            </button>
                                        )
                                    ))}
                                </td>
                                <td className="p-2 border border-gray-400">
                                    {!user.is_admin && <button onClick={() => setUserToDelete(user)} className="bg-red-600 text-white px-3 py-1 rounded cursor-pointer">حذف</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal حذف */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">آیا از حذف کاربر "{userToDelete.username}" مطمئن هستید؟</h3>
                        <div className="flex justify-end gap-4">
                            <button onClick={confirmDeleteUser} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">بله، حذف شود</button>
                            <button onClick={() => setUserToDelete(null)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition">لغو</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
