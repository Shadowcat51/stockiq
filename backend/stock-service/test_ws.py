import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/market/BINANCE:BTCUSDT"
    async with websockets.connect(uri) as websocket:
        print("Connected, waiting for 20 seconds...")
        
        # We need to receive at least one message
        try:
            for _ in range(5):
                msg = await asyncio.wait_for(websocket.recv(), timeout=15)
                data = json.loads(msg)
                print("Received:", data)
                if data.get("symbol") == "BINANCE:BTCUSDT" and "price" in data:
                    print("SUCCESS! Valid data received.")
                    break
        except asyncio.TimeoutError:
            print("FAILED: Timeout waiting for data.")
            
if __name__ == "__main__":
    asyncio.run(test_ws())
