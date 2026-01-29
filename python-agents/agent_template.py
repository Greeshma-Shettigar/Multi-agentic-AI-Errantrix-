# agents/agent_template.py
import requests, time, random, os

BACKEND = os.environ.get('BACKEND','http://localhost:5000')

AGENT_ID = "agent_"+str(random.randint(1000,9999))
AGENT_INFO = {
    "agentId": AGENT_ID,
    "name": "Agent-"+AGENT_ID,
    "location": {"lat": 12.9716, "lng": 77.5946}
}

# register
requests.post(f"{BACKEND}/api/agents/register", json=AGENT_INFO)
print("Registered", AGENT_ID)

def fetch_tasks():
    r = requests.get(f"{BACKEND}/api/tasks/unassigned")
    if r.status_code==200:
        return r.json()
    return []

while True:
    tasks = fetch_tasks()
    for t in tasks:
        # naive bid: price ~ base + random, eta ~ estimated minutes
        bid = {"agentId": AGENT_ID, "taskId": t["_id"], "price": random.randint(30,80), "eta": random.randint(5,25)}
        try:
            requests.post(f"{BACKEND}/api/agents/bid", json=bid, timeout=5)
            print("Sent bid for", t.get('title','task'), bid)
        except Exception as e:
            print("Bid failed", e)
    time.sleep(3)
