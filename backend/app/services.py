import httpx, json
from typing import List, Dict, Any
from fastapi import HTTPException, status
from pathlib import Path

# وارد کردن تنظیمات از فایل config
from .config import settings

DATA_PATH_All = Path(__file__).parent.parent / "modems.json"
DATA_PATH_MODEM1 = Path(__file__).parent.parent / "modem1.json"


# تعریف یک کلاینت httpx که در کل برنامه استفاده شود برای بهینه‌سازی
client = httpx.AsyncClient()

async def get_all_devices_from_acs() -> List[Dict[str, Any]]:
    """ لیستی از تمام دستگاه‌ها را از ACSServer دریافت می‌کند. """
    try:




        with open(DATA_PATH_All, "r", encoding="utf-8") as f:
            return json.load(f)






        # استفاده از آدرس تعریف شده در فایل .env
        url = f"{settings.ACSSERVER_URL}/devices"
        
        # ارسال درخواست GET
        response = await client.get(url, timeout=3.0)
        
        # اگر درخواست ناموفق بود (مثلاً خطای 4xx یا 5xx)، یک خطا ایجاد کن
        response.raise_for_status()
        
        # نتیجه را به صورت JSON برگردان
        return response.json()

    except httpx.HTTPStatusError as e:

        with open(DATA_PATH_All, "r", encoding="utf-8") as f:
            return json.load(f)

        # اگر خطای HTTP رخ داد، آن را به یک خطای قابل فهم برای کاربر تبدیل کن
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error from ACSServer API: {e.response.text}"
        )
    except httpx.RequestError as e:
    # fallback به mock
        with open(DATA_PATH_All, "r", encoding="utf-8") as f:
            return json.load(f)
        
        # اگر مشکل در اتصال بود (مثلاً سرور خاموش بود)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to ACSServer service: {e}"
        )

async def get_device_details_from_acs(device_id: str) -> Dict[str, Any]:
    """ اطلاعات کامل یک دستگاه خاص را با استفاده از ID آن (که معمولاً Serial Number است) دریافت می‌کند. """
    try:




        with open(DATA_PATH_MODEM1, "r", encoding="utf-8") as g:
            return json.load(g)
        


        
        # در ACSServer برای پیدا کردن با ID باید از کوئری استفاده کرد
        # ID دستگاه باید در URL انکود شود تا کاراکترهای خاص مشکلی ایجاد نکنند
        from urllib.parse import quote
        query = f'{{"_id": "{device_id}"}}'
        encoded_query = quote(query)
        
        url = f"{settings.ACSServer_url}/devices/?query={encoded_query}"
        
        response = await client.get(url, timeout=3.0)
        response.raise_for_status()
        
        # معمولاً نتیجه یک لیست است، حتی اگر یک دستگاه پیدا شود
        devices = response.json()
        if not devices:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found in ACSServer")
        
        # اولین دستگاه پیدا شده را برمی‌گردانیم
        return devices[0]

    except httpx.HTTPStatusError as e:

        with open(DATA_PATH_MODEM1, "r", encoding="utf-8") as g:
            return json.load(g)

        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Error from ACSServer API: {e.response.text}"
        )
    except httpx.RequestError as e:

        with open(DATA_PATH_MODEM1, "r", encoding="utf-8") as g:
            return json.load(g)

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to ACSServer service: {e}"
        )