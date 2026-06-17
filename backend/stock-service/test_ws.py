import asyncio
import websockets

async def test_ws():
    uri = "ws://127.0.0.1:8000/ws/market/NASDAQ:AAPL"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            await asyncio.sleep(2)
            print("Closing...")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_ws())
