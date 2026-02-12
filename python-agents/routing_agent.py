print("🚀 Routing Agent Starting...")

from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

LOCATION_CACHE = {}


class RoutingAgentOSM:

    def __init__(self):

        self.geocode_url = "https://nominatim.openstreetmap.org/search"
        self.route_url = "https://router.project-osrm.org/route/v1/driving"

        self.headers = {
            "User-Agent": "ChatuRoutingAgent/1.0 (contact: greeshma.project@gmail.com)",
            "Referer": "https://example.com"
        }


    def get_coordinates(self, place):

        # Cache
        if place in LOCATION_CACHE:
            print("⚡ Cache:", place)
            return LOCATION_CACHE[place]


        print("🌍 Geocoding:", place)

        params = {
            "q": place,
            "format": "json",
            "limit": 5,
            "countrycodes": "in",
            "addressdetails": 1,
            "accept-language": "en"
        }


        try:
            res = requests.get(
                self.geocode_url,
                params=params,
                headers=self.headers,
                timeout=15
            )

            res.raise_for_status()

        except Exception as e:
            print("❌ Geocode error:", e)
            return None


        data = res.json()
        print("🧾 RAW OSM DATA:", data)

        if not data:
            print("❌ No result for:", place)
            return None
        
        best = None
        best_score=-1

        for item in data:
            importance=item.get("importance", 0)
            address= item.get("address", {})

            has_city=any(k in address for k in ["city", "town", "village", "municipality"])
            score = importance
            
            if has_city:
                score += 1.0
            
            if score > best_score:
                best_score = score
                best = item

           

        lat = float(best["lat"])
        lon = float(best["lon"])


        LOCATION_CACHE[place] = (lat, lon)

        print(f"📍 {place} → {lat}, {lon}")

        return lat, lon


    def get_route(self, start, end):

        print("\n➡️ Routing:", start, "→", end)

        s = self.get_coordinates(start)
        if not s:
            return None

        e = self.get_coordinates(end)
        if not e:
            return None


        s_lat, s_lon = s
        e_lat, e_lon = e


        url = f"{self.route_url}/{s_lon},{s_lat};{e_lon},{e_lat}"

        print("🌐 OSRM:", url)


        try:
            res = requests.get(
                url,
                params={"overview": "false"},
                timeout=15
            )

            res.raise_for_status()

        except Exception as e:
            print("❌ Routing error:", e)
            return None


        data = res.json()

        if data.get("code") != "Ok":
            print("❌ OSRM bad response:", data)
            return None


        route = data["routes"][0]


        return {
            "distance_km": round(route["distance"] / 1000, 2),
            "time_min": round(route["duration"] / 60, 2)
        }



router = RoutingAgentOSM()


@app.route("/route", methods=["POST"])
def route_api():

    data = request.json

    start = data.get("start")
    end = data.get("end")

    if not start or not end:
        return jsonify({"error": "Missing locations"}), 400


    result = router.get_route(start, end)

    if not result:
        return jsonify({"error": "Routing failed"}), 500


    return jsonify(result)



if __name__ == "__main__":

    print("✅ Starting Flask Server...")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )
