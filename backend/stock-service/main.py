import os
import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from provider import provider
import psycopg2
import redis
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start polling yfinance data
    task = asyncio.create_task(provider.start_polling(interval_seconds=10))
    yield
    task.cancel()

app = FastAPI(title="StockIQ Stock Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Register callback to provider
async def handle_market_update(data):
    await manager.broadcast(data)

provider.register_callback(handle_market_update)

# Configuration from environment variables
PG_USER = os.getenv("POSTGRES_USER", "stockiq_user")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "stockiq_password")
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_DB = os.getenv("POSTGRES_DB", "stockiq_db")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

@app.get("/health")
def health_check():
    status = {
        "status": "OK",
        "service": "Stock Service",
        "timestamp": datetime.now().isoformat(),
        "database": "Disconnected",
        "redis": "Disconnected"
    }

    # Check Database Connection
    try:
        conn = psycopg2.connect(
            dbname=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        conn.close()
        status["database"] = "Connected"
    except Exception as e:
        status["database"] = f"Error: {str(e)}"

    # Check Redis Connection
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        status["redis"] = "Connected"
    except Exception as e:
        status["redis"] = f"Error: {str(e)}"

    return status

@app.websocket("/ws/market/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket)
    provider.add_symbol(symbol)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        provider.remove_symbol(symbol)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
