//#/utils/common.jsx
import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
dayjs.extend(jalaliday);
export function getVal(obj, path, defaultValue = 'N/A') {
    try {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === null || result === undefined) return defaultValue;
            result = result[key];
            if (result === undefined) return defaultValue;
        }
        if (typeof result === 'object' && result !== undefined) {
            return String(result);
        }
        return result !== undefined && result !== null ? String(result) : defaultValue;
    } catch {
        return defaultValue;
    }
}

export function getHostnameFromUrl(url) {
    try {
        const parsed = new URL(url);
        const hostname = parsed.hostname;
        return hostname || '';
    } catch {
        return '';
    }
}

export function formatTimeAgo(isoDate) {
    const now = dayjs();
    const then = dayjs(isoDate);

    const diffInMinutes = now.diff(then, 'minute');
    const diffInHours = Math.floor(diffInMinutes / 60);
    const remainingMinutes = diffInMinutes % 60;
    const diffInDays = Math.floor(diffInHours / 24);
    const remainingHours = diffInHours % 24;

    const parts = [];
    if (diffInDays > 0) parts.push(`${diffInDays} روز`);
    if (remainingHours > 0) parts.push(`${remainingHours} ساعت`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} دقیقه`);

    const result = parts.length > 0 ? parts.join(' و ') + ' قبل' : 'لحظاتی پیش';
    return result;
}

export function isOnline(lastInform) {
    if (!lastInform) return false;
    const last = new Date(lastInform);
    const now = new Date();
    const diffMinutes = (now - last) / 1000 / 60;
    return diffMinutes <= 10; // یعنی در ۱۰ دقیقه گذشته online بوده
}

export function isoTimeToJalali(isoTime) {
    return dayjs(isoTime).calendar('jalali').locale('fa').format('HH:mm:s YYYY/MM/DD');
}

// تابع کمکی safe stringify برای لاگ‌ها
export function safeLogStringify(obj, fallback = 'خطا در تبدیل به رشته') {
    try {
        return JSON.stringify(obj);
    } catch {
        return fallback;
    }
}