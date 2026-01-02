export function findLEMRPath(
  sourceId,
  sinkId,
  neighborsMap,
  thresholds = { minEnergy: 30, minRSSI: -80 }
) {
  if (!neighborsMap[sourceId]) return null;

  const path = [sourceId];
  const visited = new Set([sourceId]);

  let current = sourceId;

  while (current !== sinkId) {
    const neighbors = neighborsMap[current] || [];

    // 1. Filter out neighbors with:
    //    RE < 30% , RSSI < -80 dBm
    const valid = neighbors.filter(
      (n) =>
        n.residualEnergy >= thresholds.minEnergy &&
        n.rssi >= thresholds.minRSSI
    );

    if (!valid.length) return null;

    // 2. Select lowest hop count
    // 3. If same hop → choose highest RSSI
    valid.sort((a, b) => {
      if (a.hopToSink !== b.hopToSink) {
        return a.hopToSink - b.hopToSink;
      }
      return b.rssi - a.rssi;
    });

    const next = valid[0].id;

    if (visited.has(next)) return null;

    visited.add(next);
    path.push(next);
    current = next;
  }

  return path;
}
