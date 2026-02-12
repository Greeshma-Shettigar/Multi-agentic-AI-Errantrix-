function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function routingAgent(task, bids, agents) {
  let results = [];

  for (let bid of bids) {
    const agent = agents.find((a) => a.agentId === bid.agentId);

    if (!agent) continue;

    // Distance from agent → pickup
    const d1 = getDistance(
      agent.currentLocation.lat,
      agent.currentLocation.lng,
      task.pickupCoords.lat,
      task.pickupCoords.lng,
    );

    // Distance pickup → drop
    const d2 = getDistance(
      task.pickupCoords.lat,
      task.pickupCoords.lng,
      task.dropCoords.lat,
      task.dropCoords.lng,
    );

    const totalDistance = d1 + d2;

    // System ETA (40 km/h avg)
    const systemETA = (totalDistance / 40) * 60;

    // Penalty if agent lied
    const etaDiff = Math.abs(systemETA - bid.eta);

    const penalty = etaDiff > 10 ? 20 : 0;

    const score = bid.price * 0.4 + systemETA * 0.4 + penalty;

    results.push({
      ...bid,
      systemETA,
      score,
    });
  }

  results.sort((a, b) => a.score - b.score);

  return results;
}

module.exports = routingAgent;
