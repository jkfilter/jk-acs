import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import apiClient from '../api/axiosConfig';
import { Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { isoTimeToJalali } from '../utils/common';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// کامپوننت برای نمایش آیکون وضعیت
const StatusIcon = ({ status }) => {
    switch (status) {
        case 'sent_to_genieacs':
            return <span className="inline-flex gap-1 text-amber-500"><Clock className="w-5 h-5" />در انتظار اعمال</span>;
        case 'completed_success':
            return <span className="inline-flex gap-1 text-green-500"><CheckCircle2 className="w-5 h-5" />اعمال شد</span>;
        case 'failed':
        case 'completed_fault':
            return <span className="inline-flex gap-1 text-red-600"><XCircle className="w-5 h-5" />ناموفق</span>;
        default:
            return null;
    }
};

const TaskHistory = ({ deviceId, refreshKey }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // آدرس WebSocket را می‌سازیم (پروتکل ws یا wss)
    const socketUrl = `ws://localhost:8000/ws/device-status/${deviceId}`;

    // استفاده از هوک برای اتصال به WebSocket
    const { lastMessage } = useWebSocket(socketUrl, {
        shouldReconnect: (closeEvent) => true, // همیشه سعی در اتصال مجدد کن
    });

const handleDeleteTask = async (taskId) => {
    // از SweetAlert2 برای تایید استفاده کنید
    const result = await Swal.fire({
        title: 'آیا مطمئن هستید؟',
        text: "این تسک در حال انتظار حذف خواهد شد!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'بله، حذف کن!',
        cancelButtonText: 'لغو',
    });

    if (result.isConfirmed) {
        try {
            await apiClient.delete(`/acs/tasks/${taskId}`);
            // نیازی به آپدیت دستی state نیست، چون پیام WebSocket این کار را می‌کند
            Swal.fire('حذف شد!', 'تسک با موفقیت حذف شد.', 'success');
        } catch (error) {
            Swal.fire('خطا!', error.response?.data?.detail || 'مشکلی در حذف تسک پیش آمد.', 'error');
        }
    }
};

        // --- بخش جدید: پردازش پیام‌های دریافتی از WebSocket ---
    useEffect(() => {
        if (lastMessage !== null) {
            const data = JSON.parse(lastMessage.data);
            if (data.type === 'TASK_UPDATE') {
                // پیدا کردن تسک مورد نظر در لیست و به‌روزرسانی وضعیت آن
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === data.task_id
                            ? { ...task, status: data.new_status }
                            : task
                    )
                );
            }
            if (data.type === 'TASK_DELETE') {
                setTasks(prevTasks => prevTasks.filter(task => task.id !== data.task_id));
            }
        }
    }, [lastMessage]);


    useEffect(() => {
        const fetchTasks = async () => {
            if (!deviceId) return;
            setLoading(true);
            setError('');
            try {
                const response = await apiClient.get(`/acs/devices/${deviceId}/tasks`);
                setTasks(response.data);
            } catch (err) {
                setError('خطا در دریافت تاریخچه عملیات.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [deviceId, refreshKey]); // با تغییر refreshKey، این تابع مجددا اجرا می‌شود

    if (loading) return <p className="text-sm text-center p-4">در حال بارگذاری تاریخچه...</p>;
    if (error) return <p className="text-sm text-red-600 text-center p-4">{error}</p>;

    return (
        <div className="shadow-sm rounded-lg p-4 my-4 bg-white">
            <h2 className="font-semibold text-md mb-3 text-right text-gray-700">تاریخچه آخرین عملیات</h2>
            {tasks.length === 0 ? (
                <p className="text-sm text-gray-500">هیچ عملیاتی برای این دستگاه ثبت نشده است.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <thead className="bg-emerald-400/70 text-right text-xs font-medium text-emerald-700">
                            <tr>
                                <th className="p-2">وضعیت</th>
                                <th className="p-2">عملیات</th>
                                <th className="p-2">کاربر</th>
                                <th className="p-2">زمان ارسال</th>
                                <th className="p-2">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks.map(task => (
                                <tr key={task.id} className="text-gray-600 text-sm bg-emerald-50/50 even:bg-emerald-50 hover:bg-emerald-100">
                                    <td className="p-1 whitespace-nowrap"><StatusIcon status={task.status} /></td>
                                    <td className="p-1 whitespace-nowrap">{task.task_name}</td>
                                    <td className="p-1 whitespace-nowrap">{task.created_by?.username || 'نامشخص'}</td>
                                    <td className="p-1 whitespace-nowrap">{isoTimeToJalali(task.created_at)}</td>
                                    <td className="p-1 whitespace-nowrap">
                                        {task.status === 'sent_to_genieacs' && (
                                            <button onClick={() => handleDeleteTask(task.id)} title="حذف تسک" className="text-red-500 hover:text-red-700 cursor-pointer">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TaskHistory;