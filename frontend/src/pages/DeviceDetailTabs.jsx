import { useState } from 'react';

const TABS = [
  { id: 'info', title: 'اطلاعات کلی' },
  { id: 'wifi', title: 'Wi-Fi' },
  { id: 'pppoe', title: 'PPPoE' },
  { id: 'lan', title: 'LAN / DHCP' },
  { id: 'summary', title: 'خلاصه دستگاه' },
  { id: 'device', title: 'Device Info' },
];

const DeviceDetailTabs = ({ device }) => {
  const [activeTab, setActiveTab] = useState('info');

  const getVal = (obj, path, def = 'N/A') => {
    try {
      const keys = path.split('.');
      return keys.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : def), obj);
    } catch {
      return def;
    }
  };

  const serialNumber = getVal(device, '_deviceId._SerialNumber._value');
  const productClass = getVal(device, '_deviceId._ProductClass');
  const wifiSSID1 = getVal(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID._value');
  const wifiSSID2 = getVal(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.SSID._value');
  const wifiEnabled = getVal(device, 'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.Enable._value') === 'true' ? 'فعال' : 'غیرفعال';

  const TabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <ul className="space-y-2">
            <li>سریال: {serialNumber}</li>
            <li>کلاس محصول: {productClass}</li>
            <li>سازنده: {getVal(device, '_deviceId._Manufacturer')}</li>
            <li>مدل: {getVal(device, '_deviceId._OUI')}</li>
          </ul>
        );
      case 'wifi':
        return (
          <ul className="space-y-2">
            <li>SSID1: {wifiSSID1}</li>
            <li>SSID2: {wifiSSID2}</li>
            <li>وضعیت Wi-Fi: {wifiEnabled}</li>
          </ul>
        );
      case 'pppoe':
        return (
          <ul className="space-y-2">
            <li>کاربر PPPoE: {getVal(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.Username._value')}</li>
            <li>وضعیت اتصال: {getVal(device, 'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.ConnectionStatus._object')}</li>
          </ul>
        );
      case 'lan':
        return (
          <ul className="space-y-2">
            <li>DHCPv4: {getVal(device, 'InternetGatewayDevice.DHCPv4._object._value')}</li>
            <li>DHCPv6: {getVal(device, 'InternetGatewayDevice.DHCPv6._object._value')}</li>
            <li>DNS: {getVal(device, 'InternetGatewayDevice.DNS._object._value')}</li>
          </ul>
        );
      case 'summary':
        return (
          <p>{getVal(device, 'InternetGatewayDevice.DeviceSummary._value')}</p>
        );
      case 'device':
        return (
          <ul className="space-y-2">
            <li>Hardware Version: {getVal(device, 'InternetGatewayDevice.DeviceInfo.HardwareVersion._value')}</li>
            <li>Software Version: {getVal(device, 'InternetGatewayDevice.DeviceInfo.SoftwareVersion._value')}</li>
            <li>Spec Version: {getVal(device, 'InternetGatewayDevice.DeviceInfo.SpecVersion._value')}</li>
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="shadow-sm rounded-lg p-2 my-4 bg-white">

      {/* تب‌ها */}
      <div className="flex flex-wrap gap-2 mb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white'
                : 'bg-sky-100 text-sky-700 cursor-pointer hover:bg-sky-400 hover:text-white'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* محتوای تب انتخاب‌شده */}
      <div className="bg-white p-4 rounded-lg border border-sky-500 min-h-[200px]">
        <TabContent />
      </div>
    </div>
  );
};

export default DeviceDetailTabs;
