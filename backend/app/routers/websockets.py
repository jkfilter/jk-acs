# app/routers/websockets.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..websocket_manager import manager

router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"]
)

@router.websocket("/device-status/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await manager.connect(websocket, device_id)
    try:
        # این حلقه ارتباط را زنده نگه می‌دارد
        while True:
            # منتظر پیام از کلاینت (در این سناریو نیازی نیست)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, device_id)