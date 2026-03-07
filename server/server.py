import asyncio
import websockets
import json
import time
import random

HZ = 20
PERIOD = 1.0 / HZ


def random_pose():
    return {
        "x": round(random.uniform(-20, 20), 2),
        "y": round(random.uniform(-20, 20), 2)
    }


def generate_data():

    drones = []
    for i in range(4):
        drones.append({
            "id": i + 1,
            "pose": random_pose()
        })

    mines = []
    for _ in range(random.randint(2, 6)):
        mines.append(random_pose())

    path = []
    x, y = 0, 0
    for _ in range(5):
        x += random.uniform(0.5, 2)
        y += random.uniform(0.5, 2)
        path.append({
            "x": round(x, 2),
            "y": round(y, 2)
        })

    data = {
        "timestamp": time.time(),
        "mode": "Autonomous",
        "drones": drones,
        "mines": mines,
        "navigation_path": path
    }

    return data


async def publisher(websocket):

    print("Client connected")

    try:
        while True:
            data = generate_data()
            await websocket.send(json.dumps(data))
            await asyncio.sleep(PERIOD)

    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")


async def main():

    server = await websockets.serve(
        publisher,
        "0.0.0.0",
        8080,
        ping_interval=None
    )

    print("WebSocket running at ws://localhost:8080")
    print("Publishing at 20Hz")

    await server.wait_closed()


asyncio.run(main())
