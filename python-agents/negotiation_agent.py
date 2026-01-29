import sys
import json

def negotiate(bids):
    if not bids or len(bids) < 2:
        return None

    winner = bids[0]

    for bid in bids:
        if bid["price"] < winner["price"] or (
            bid["price"] == winner["price"] and bid["eta"] < winner["eta"]
        ):
            winner = bid

    return {
        "agentId": winner["agentId"],
        "price": winner["price"],
        "eta": winner["eta"]
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        bids = json.loads(input_data)

        result = negotiate(bids)

        if result:
            print(json.dumps(result))
        else:
            print(json.dumps({}))

        sys.stdout.flush()

    except Exception as e:
        print(json.dumps({ "error": str(e) }))
        sys.stdout.flush()
