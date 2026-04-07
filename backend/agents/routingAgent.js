const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

console.log("----- ROUTING DEBUG -----");

const routingAgent = (bids, pickup, drop) => {
  console.log("📦 ALL BIDS:", bids);
   const validBids = bids.filter((b) => b.lat && b.lng);

   console.log("✅ VALID BIDS:", validBids.length);

   if (validBids.length === 0) {
     console.log("❌ No valid bids for routing");
     return null;
   }

   let best = null;
   let minDistance = Infinity;


  for (let bid of bids) {
    console.log("👉 Checking bid:", bid);
     if (!bid.lat || !bid.lng) {
    console.log("⚠ Skipping invalid bid:", bid);
    continue;
  }

  if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
    console.log("❌ Invalid pickup/drop coordinates");
    return null;
  }
    const d1 = getDistance(bid.lat, bid.lng, pickup.lat, pickup.lng);
    const d2 = getDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);

    const total = d1 + d2;

    console.log(`Agent: ${bid.agentId}`);
    console.log(`Distance: ${total}`);

    if (total < minDistance) {
      minDistance = total;
      best = {
        ...bid,
        distance: total, // 🔥 ADD THIS
      };
    }
  }
  console.log("🏆 ROUTING WINNER:", best);
  return best;
};

module.exports = routingAgent;
