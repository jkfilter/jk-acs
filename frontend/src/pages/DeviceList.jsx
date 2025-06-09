//#DeviceList.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import DeviceDetailPage from './DeviceDetailPage';
import { getVal, getHostnameFromUrl, formatTimeAgo, isOnline, isoTimeToJalali } from '../utils/common';
import { Globe, CirclePower } from 'lucide-react';


const DeviceList = ({ deviceId, refreshKey, onDeviceSelect }) => { 
    console.log(`%c[DeviceList] Rendered. deviceId: ${deviceId}, refreshKey: ${refreshKey}`, "color: orange; font-weight: bold;");

    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // اگر deviceId نیست، کل لیست مودم‌ها را بگیر
                console.log("[DeviceList] Fetching all devices: /acs/devices/");
                const response = await apiClient.get('/acs/devices/');
                if (Array.isArray(response.data)) {
                    setDevices(response.data);
                } else {
                    setError("فرمت پاسخ برای لیست مودم‌ها نامعتبر است.");
                    setDevices([]);
                }
            } catch (err) {
                setError(err.response?.data?.detail || `خطا در دریافت اطلاعات: ${err.message}`);
                setDevices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [deviceId, refreshKey]);

    if (loading) return <p className="text-center p-4">در حال بارگذاری اطلاعات...</p>;
    if (error) return <p className="text-center p-4 text-red-600">خطا: {error}</p>;

    if (deviceId) {
        // یک مثال ساده از نمایش جزییات، می‌تونی کامل‌ترش کنی
            return <DeviceDetailPage deviceId={deviceId} refreshKey={refreshKey} />;
    }

    // اگر deviceId نیست یعنی صفحه لیست مودم‌ها
    if (!devices || devices.length === 0) return <p className="text-center p-4">هیچ مودمی یافت نشد.</p>;

    const handleRowClick = (device) => {
        const deviceId = device?._id 
            || device?.InternetGatewayDevice?.SerialNumber?._value 
            || undefined;
        const title = device?._deviceId?._SerialNumber
            ||device?.InternetGatewayDevice?.DeviceInfo?.ModelName?._value 
            || device?.InternetGatewayDevice?.SerialNumber?._value
            || device?._id
            || 'نامشخص';

        console.log(`[DeviceList] Extracted deviceId: ${deviceId}, title: ${title}`);

        if (onDeviceSelect) {
            onDeviceSelect({
                key: deviceId,
                deviceId,
                title,
            });
        }
    };
    
    return (
        <table className="min-w-full divide-y divide-gray-200">
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
                {devices.map(device => {
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
                        <tr key={device._id || SerialNumber} onClick={() => handleRowClick(device)} className="hover:bg-gray-100 cursor-pointer text-sm even:bg-gray-50">
                        <td className="p-3 whitespace-nowrap text-gray-900 border-l border-l-gray-100"><div>{Producter}</div><div className="inline-block rounded-md text-white px-2 py-1 ml-1 bg-sky-500">{ProductClass}</div><div className="inline-block rounded-md text-white px-2 py-1 bg-sky-500">{ProductOUI}</div></td>
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
                    );
                })}
            </tbody>
        </table>
    );
};

export default DeviceList;
