//#/pages/DeviceDetailPage.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { Info, Wifi, Globe, Settings, CirclePower } from 'lucide-react';
import DeviceDetailTabs from './DeviceDetailTabs';
import TaskHistory from '../components/TaskHistory';
import { getVal, getHostnameFromUrl, formatTimeAgo, isOnline, isoTimeToJalali, safeLogStringify } from '../utils/common';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DeviceDetailPage = ({ deviceId, refreshKey }) => {
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [taskRefreshKey, setTaskRefreshKey] = useState(0);


const handleChangeWifiPassword = async () => {
    if (!device?._deviceId?._SerialNumber) {
        Swal.fire({
            icon: 'error',
            title: 'سریال نامبر دستگاه موجود نیست!',
        });
        return;
    }

    const { value: newPassword } = await MySwal.fire({
        title: 'تغییر رمز وای‌فای',
        input: 'text',
        inputLabel: 'رمز جدید وای‌فای را وارد کنید:',
        inputPlaceholder: 'رمز وای‌فای',
        confirmButtonText: 'ارسال',
        confirmButtonColor: '#00c950',
        showCancelButton: true,
        cancelButtonText: 'انصراف',
        cancelButtonColor: '#51a2ff',
        inputValidator: (value) => {
            if (!value) return 'رمز نمی‌تواند خالی باشد!';
            if (value.length < 8) return 'رمز باید حداقل ۸ کاراکتر باشد!';
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        showLoaderOnConfirm: true,
        preConfirm: async (value) => {
            try {
                const response = await apiClient.post('/acs/tasks/change-wifi-password', {
                    deviceId: device._id,
                    newPassword: value,
                });
                return response.data;
            } catch (error) {
                Swal.showValidationMessage(
                    `خطا در ارسال دستور: ${error?.response?.data?.detail || error.message}`
                );
            }
        },
    });

    if (newPassword) {
        Swal.fire({
            icon: 'success',
            title: 'دستور ارسال شد!',
            html: `
                رمز جدید در صف اجرا قرار گرفت.<br />
                پس از ارتباط بعدی مودم با سرور، اعمال خواهد شد.
            `,
            timer: 3000,
            showConfirmButton: false,
        });

        // ریفرش تسک‌ها
        setTaskRefreshKey(prev => prev + 1);
    }
};



useEffect(() => {
    console.log(`[DeviceDetailPage useEffect] deviceId: "${deviceId}", refreshKey: ${refreshKey}`);

    const fetchDeviceDetails = async () => {
        if (!deviceId || typeof deviceId !== 'string') {
            setError('شناسه دستگاه معتبر نیست.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');
            const response = await apiClient.get(`/acs/devices/${deviceId}`);
            setDevice(response.data);
        } catch (err) {
            console.error('[DeviceDetailPage] API error:', err);
            setError('خطا در دریافت اطلاعات دستگاه: ' + (err.response?.data?.detail || err.message));
            setDevice(null);
        } finally {
            setLoading(false);
        }
    };

    fetchDeviceDetails();
}, [deviceId, refreshKey]);


    if (loading) {
        return <p className="text-center p-4">در حال بارگذاری اطلاعات دستگاه {deviceId && `"${deviceId}"`}...</p>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded">
                {error}
            </div>
        );
    }

    if (!device) {
        return (
            <div className="p-4 text-gray-600">
                اطلاعاتی برای دستگاه با شناسه "{deviceId}" یافت نشد.
            </div>
        );
    }

    // استخراج اطلاعات
    const ProductOUI = device?._deviceId?._OUI || 'N/A';
    const ProductClass = device?._deviceId?._ProductClass || 'N/A';
    const Producter = getVal(device, '_deviceId._Manufacturer');
    const SerialNumber = device?._deviceId?._SerialNumber || device?._id || 'ID نامشخص';
    const MACAddress = getVal(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.MACAddress._value');
    const ConnectionRequestURL = getHostnameFromUrl(device?.InternetGatewayDevice?.ManagementServer?.ConnectionRequestURL?._value) || 'N/A';
    const LastConnectionIP = getVal(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._value');
    const LastConnectionTime0 = getVal(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress._timestamp');
    const LastConnectionTime = isoTimeToJalali(LastConnectionTime0);
    const lastInform = device?._lastInform || '';
    const FirstRegistered0 = device?._registered || '';
    const FirstRegistered = isoTimeToJalali(FirstRegistered0);

    return (
        <div className="p-2">
            <table className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-right text-xs font-medium text-gray-500">
                    <tr>
                        <th className="p-3 border-l border-l-gray-100">برند/کلاس دستگاه</th>
                        <th className="p-3 border-l border-l-gray-100">سریال/مک دستگاه</th>

                        <th className="p-3 border-l border-l-gray-100">وضعیت</th>
                        <th className="p-3 border-l border-l-gray-100">آی پی/زمان آخرین اتصال</th>
                        <th className="p-3 border-l border-l-gray-100">آی پی/زمان ثبت</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">

                        <tr className="text-sm">
                           <td className="p-3 whitespace-nowrap text-gray-900 border-l border-l-gray-100"><div>{Producter}</div><div className="inline-block rounded-md text-white px-2 py-1 ml-1 bg-teal-500">{ProductClass}</div><div className="inline-block rounded-md text-white px-2 py-1 bg-teal-500">{ProductOUI}</div></td>
                           <td className="p-3 whitespace-nowrap border-l border-l-gray-100"><div className='border border-gray-300 bg-gray-100 text-gray-500 px-1 text-center rounded-md mb-1 font-semibold'>{SerialNumber}</div><div className='border border-gray-300 bg-gray-100 text-gray-500 px-1 text-center rounded-md font-semibold'>{MACAddress}</div></td>                           
                           <td className="p-3 whitespace-nowrap border-l border-l-gray-100">
                            <span className={`inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-md text-xs font-semibold ${
                                isOnline(lastInform)
                                    ? 'bg-green-300 text-green-700'
                                    : 'bg-red-300 text-red-700'
                                }`}>
                                {isOnline(lastInform) ? 
                                    <><Globe className="w-4 h-4" />آنلاین</> : <><CirclePower className="w-4 h-4" />آفلاین</>
                                }
                            </span>
                           </td>
                           <td className="p-3 whitespace-nowrap border-l border-l-gray-100"><div className='bg-blue-400 text-white px-1 text-center rounded-md mb-1 font-semibold'>{LastConnectionIP}</div><div className='bg-amber-400 text-white px-1 text-center rounded-md mb-1 font-semibold'>{LastConnectionTime}</div><div className='border border-amber-200 bg-amber-100 text-gray-500 px-1 text-center rounded-md text-xs'>{formatTimeAgo(LastConnectionTime0)}</div></td>
                           <td className="p-3 whitespace-nowrap"><div className='bg-green-400 text-white px-1 text-center rounded-md mb-1 font-semibold'>{ConnectionRequestURL}</div><div className='bg-cyan-400 text-white px-1 text-center rounded-md font-semibold'>{FirstRegistered}</div></td>
                        </tr>
                    
                </tbody>
            </table>

            <div className="shadow-sm rounded-lg px-4 py-2 my-4 bg-white">
                <h2 className='font-semibold text-md mb-2 text-right text-gray-600'>عملیات پرکاربرد</h2>
                <div className='flex gap-2 p-2'>
                    <div className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>تغییر نام وای فای</div>
                    <div onClick={handleChangeWifiPassword} className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>تغییر رمز وای فای</div>
                    <div className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>تغییر نام کاربری PPPoE</div>
                    <div className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>تغییر رمز PPPoE</div>
                    <div className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>ریستارت دستگاه</div>
                    <div className='bg-pink-500 text-white text-sm font-medium cursor-pointer rounded-md px-4 py-2 hover:bg-pink-400'>پینگ از روی دستگاه</div>
                </div>
            </div>
            
            <TaskHistory deviceId={deviceId} refreshKey={taskRefreshKey} />

            {device && <DeviceDetailTabs device={device} />}




        </div>

    );
};

export default DeviceDetailPage;
