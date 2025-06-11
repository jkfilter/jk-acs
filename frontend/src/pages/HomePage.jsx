//#/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import apiClient from '../api/axiosConfig';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  ResponsiveContainer,
} from 'recharts';
import { getVal, getHostnameFromUrl, formatTimeAgo, isOnline, isoTimeToJalali, safeLogStringify } from '../utils/common';
import { Router, Cpu, Globe, CirclePower } from 'lucide-react';

const colorMapPie = {
  Online: '#10D281',
  Offline: '#fb2c36',
  Connecting: '#d08700',
};

export default function Dashboard() {
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [tableData, setTableData] = useState([]);

  const [errors, setErrors] = useState({
    pie: null,
    bar: null,
    line: null,
    table: null,
  });

  useEffect(() => {
    document.body.style.backgroundColor = '#f2f2f2';
    const fetchData = async () => {
      const results = await Promise.allSettled([
        apiClient.get('/acs/chart/devices'),     // pie
        apiClient.get('/acs/chart/users'),       // bar
        apiClient.get('/acs/chart/traffic'),     // line
        apiClient.get('/acs/devices/'),    // table
      ]);

      const [devicesRes, usersRes, trafficRes, latestRes] = results;

      if (devicesRes.status === 'fulfilled') {
        setPieData(devicesRes.value.data);
      } else {
        setErrors(prev => ({ ...prev, pie: 'خطا در دریافت وضعیت دستگاه‌ها' }));
        console.error('PieChart error:', devicesRes.reason);
      }

      if (usersRes.status === 'fulfilled') {
        setBarData(usersRes.value.data);
      } else {
        setErrors(prev => ({ ...prev, bar: 'خطا در دریافت کاربران فعال' }));
        console.error('BarChart error:', usersRes.reason);
      }

      if (trafficRes.status === 'fulfilled') {
        setLineData(trafficRes.value.data);
      } else {
        setErrors(prev => ({ ...prev, line: 'خطا در دریافت ترافیک شبکه' }));
        console.error('LineChart error:', trafficRes.reason);
      }

      if (latestRes.status === 'fulfilled') {
        setTableData(latestRes.value.data);
      } else {
        setErrors(prev => ({ ...prev, table: 'خطا در دریافت لیست دستگاه‌ها' }));
        console.error('Table data error:', latestRes.reason);
      }
    };

    fetchData();

    return () => {
    document.body.style.backgroundColor = ''; // ریست در خروج از صفحه
    };
  }, []);

  return (
    <div className="px-4 py-2 space-y-6">

    <div>
      <Link
        to="/acs"
        className="inline-flex items-center gap-1 text-white bg-green-500 hover:bg-green-400 rounded px-4 py-2 mx-1 font-medium"
      >
        <Router className="w-5 h-5" />
        <span>لیست دستگاه‌ها</span>
      </Link>
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-white bg-blue-500 hover:bg-blue-400 rounded px-4 py-2 mx-1 font-medium"
      >
        <Cpu className="w-5 h-5" />
        <span>لیست فریمورها</span>
      </Link>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow px-4 py-2">
          <h2 className="font-semibold text-md mb-2 text-right">وضعیت دستگاه‌ها</h2>
          <div className="flex justify-center items-center" dir="ltr">
            <div className="w-full max-w-md h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                {errors.pie ? (
                  <div className="text-red-600 text-sm">{errors.pie}</div>
                ) : pieData.length ? (
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colorMapPie[entry.name] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <div className="text-gray-500 text-sm text-right" dir='rtl'>در حال بارگذاری...</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow px-4 py-2">
          <h2 className="font-semibold text-md mb-2 text-right">کاربران فعال روزانه</h2>
          <div className="flex justify-center items-center" dir="ltr">
            <div className="w-full max-w-md h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                {errors.bar ? (
                  <div className="text-red-600 text-sm">
                    {errors.bar}
                  </div>
                ) : barData.length ? (
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-90} textAnchor="end" height={45} fontSize={12}/>
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="users"
                      fill="#0088FE"
                      radius={[6, 6, 0, 0]} // گوشه‌های بالای میله‌ها گرد
                      barSize={30} // ضخامت میله‌ها
                    />
                  </BarChart>
                ) : (
                  <div className="text-gray-500 text-sm text-right" dir='rtl'>
                    در حال بارگذاری...
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>


        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow px-4 py-2">
          <h2 className="font-semibold text-md mb-2 text-right">ترافیک شبکه</h2>
          <div className="flex justify-center items-center" dir="ltr">
            <div className="w-full max-w-md h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                {errors.line ? (
                  <p className="text-red-600 text-sm">{errors.line}</p>
                ) : lineData.length ? (
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="traffic" stroke="#bd24e8" strokeWidth={2} />
                  </LineChart>
                ) : (
                  <p className="text-gray-500 text-sm text-right" dir='rtl'>در حال بارگذاری...</p>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* جدول */}
      <div className="bg-white rounded-2xl shadow px-4 py-2 overflow-auto mb-4">
        <h2 className="font-semibold text-md mb-2 text-right">آخرین دستگاه‌ها</h2>
        {errors.table ? (
          <p className="text-red-600 text-sm">{errors.table}</p>
        ) : tableData.length ? (
          <table className="min-w-full divide-y divide-gray-200 shadow-sm">
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
                {tableData.map(device => {
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
                        <tr key={device._id || SerialNumber} className="text-sm even:bg-gray-50">
                        <td className="p-3 whitespace-nowrap text-gray-900 border-l border-l-gray-100"><div>{Producter}</div><div className="inline-block rounded-md text-white px-2 py-1 ml-1 bg-sky-500">{ProductClass}</div><div className="inline-block rounded-md text-white px-2 py-1 bg-sky-500">{ProductOUI}</div></td>
                           <td className="p-3 whitespace-nowrap border-l border-l-gray-100"><div className='border border-gray-300 bg-gray-100 text-gray-500 px-1 text-center rounded-md mb-1 font-semibold'>{SerialNumber}</div><div className='border border-gray-300 bg-gray-100 text-gray-500 px-1 text-center rounded-md font-semibold'>{MACAddress}</div></td>                           
                           <td className="p-3 whitespace-nowrap border-l border-l-gray-100">
                            <span className={`inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-md text-xs font-semibold ${
                                isOnline(lastInform)
                                    ? 'bg-green-300 text-green-700'
                                    : 'bg-red-300 text-red-700'
                                }`}>
                                {isOnline(lastInform) ? 
                                    <>
                                    <Globe className="w-4 h-4" />
                                    آنلاین
                                    </>
                                : 
                                    <>
                                    <CirclePower className="w-4 h-4" />
                                    آفلاین
                                    </>
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
        ) : (
          <p className="text-gray-500 text-sm text-right" dir='rtl'>در حال بارگذاری...</p>
        )}
      </div>
    </div>
  );
}
