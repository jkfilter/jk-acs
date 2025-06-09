import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000', // آدرس بک‌اند شما، در صورت نیاز تغییر بده
  timeout: 10000, // timeout 10 ثانیه (اختیاری)
});

// لاگ کردن هر درخواست قبل از ارسال
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.url} | Token: ${token ? 'FOUND' : 'NOT FOUND'}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// لاگ و هندل کردن خطاهای پاسخ، مخصوصاً 401
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.config.method.toUpperCase()} ${response.config.url} | Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API RESPONSE ERROR] ${error.response.config.method.toUpperCase()} ${error.response.config.url} | Status: ${error.response.status}`, error.response.data);
      if (
        error.response.status === 401 &&
        !error.config.url.includes('/token')
        ) {
        console.warn("توکن نامعتبر یا منقضی شده، در حال هدایت به صفحه لاگین...");
        localStorage.removeItem('token');
        window.location.href = '/login'; // آدرس صفحه لاگین خودت رو تنظیم کن
      }
    } else {
      console.error('[API RESPONSE ERROR] بدون پاسخ از سرور:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
