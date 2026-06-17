import os
from fastapi import FastAPI
import psycopg2
import redis
from confluent_kafka import Producer
from datetime import datetime

app = FastAPI(title="StockIQ Stock Service")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
