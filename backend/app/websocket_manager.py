# app/websocket_manager.py
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # ساختار: { "device_id_1": [websocket1, websocket2], "device_id_2": [websocket3] }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = []
        self.active_connections[device_id].append(websocket)

    def disconnect(self, websocket: WebSocket, device_id: str):
        if device_id in self.active_connections:
            self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]

    async def broadcast_to_device(self, device_id: str, message: str):
        if device_id in self.active_connections:
            for connection in self.active_connections[device_id]:
                await connection.send_text(message)

# یک نمونه از مدیر ارتباطات می‌سازیم تا در کل برنامه قابل استفاده باشد
manager = ConnectionManager()