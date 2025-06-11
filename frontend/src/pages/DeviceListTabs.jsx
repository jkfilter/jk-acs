//#/pages/DeviceListTabs.jsx
import React, { useState } from 'react';
import DeviceList from './DeviceList';
import { X, RefreshCcw } from 'lucide-react';

const DeviceListTabs = () => {
  // تب‌ها به صورت آرایه آبجکت { key, deviceId, title }
  // تب اول، تب اصلی لیست مودم‌هاست و deviceId=null است
  const [tabs, setTabs] = useState([
    { key: 'main', deviceId: null, title: 'لیست دستگاه ها' }
  ]);
  const [activeKey, setActiveKey] = useState('main');
  const [refreshKeys, setRefreshKeys] = useState({ main: 0 }); // هر تب یک کلید رفرش جدا دارد

  // باز کردن تب جدید یا فعال کردن تب موجود
  const openTab = ({ key, deviceId, title }) => {
    // اگر تب وجود داشت، فقط فعالش کن
    if (tabs.find(tab => tab.key === key)) {
      setActiveKey(key);
    } else {
      // تب جدید اضافه کن و فعالش کن
      setTabs(prev => [...prev, { key, deviceId, title }]);
      setActiveKey(key);
      // مقدار رفرش کلید جدید صفر باشه
      setRefreshKeys(prev => ({ ...prev, [key]: 0 }));
    }
  };

  // بستن تب
  const closeTab = (keyToClose) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.key !== keyToClose);
      // اگر تب فعال رو بستیم، تب کناری رو فعال کنیم (یا تب اصلی)
      if (activeKey === keyToClose) {
        if (newTabs.length > 0) {
          setActiveKey(newTabs[newTabs.length - 1].key);
        } else {
          setActiveKey('main');
        }
      }
      return newTabs;
    });
    // کلید رفرش آن تب را هم حذف کن
    setRefreshKeys(prev => {
      const copy = { ...prev };
      delete copy[keyToClose];
      return copy;
    });
  };

  // رفرش تب خاص (افزایش مقدار refreshKey آن تب)
  const refreshTab = (keyToRefresh) => {
    setRefreshKeys(prev => ({
      ...prev,
      [keyToRefresh]: (prev[keyToRefresh] || 0) + 1
    }));
  };

  return (
    <div className="p-4">
      {/* نوار تب‌ها */}
      <div className="flex">
        {tabs.map(({ key, title }) => (
          <div
            key={key}
            className={`flex items-center max-w-[260px] px-1 py-1 cursor-pointer text-white select-none border-2 border-t-transparent border-x-transparent border-b-gray-100 ml-1 rounded-t-lg bg-violet-400
              ${activeKey === key ? 'bg-violet-700 border-b-violet-700' : 'hover:bg-violet-500'}`}
            onClick={() => setActiveKey(key)}
          >
            <span>{title}</span>
            {/* دکمه رفرش کنار تب */}
            <button
                onClick={(e) => {
                  setActiveKey(key)
                  e.stopPropagation();
                  refreshTab(key);
                }}
                title="رفرش تب"
                className="mr-1 text-green-400 text-xl cursor-pointer hover:text-green-500"
              >
                <RefreshCcw strokeWidth={3} className="w-5 h-5" />
              </button>
            {/* دکمه بستن تب (تب اصلی غیرقابل بسته شدن) */}
            {key !== 'main' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(key);
                }}
                title="بستن تب"
                className="mr-1 text-red-500 hover:text-red-600 text-xl cursor-pointer"
              >
                <X strokeWidth={3} className="w-6 h-6" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* محتوای تب فعال */}
      <div className="bg-gray-100 border border-gray-300 rounded-tl-lg rounded-b-lg shadow-md overflow-hidden min-h-[300px]">
        {tabs.map(({ key, deviceId }) => (
          <div key={key} style={{ display: activeKey === key ? 'block' : 'none' }}>
            <DeviceList
              deviceId={deviceId}
              refreshKey={refreshKeys[key] || 0}
              onDeviceSelect={(tabInfo) => {
                // وقتی روی مودم کلیک شد، تب جدید باز کن
                if (tabInfo.key !== 'main') openTab(tabInfo);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceListTabs;
