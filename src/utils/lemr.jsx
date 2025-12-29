


export function findLEMRPath(
  sourceId,
  sinkId,
  neighborsMap,
  thresholds = { minEnergy: 30, minRSSI: -90 }
) {
  if (!neighborsMap[sourceId]) return null;

  const path = [sourceId];
  const visited = new Set(path);

  let current = sourceId;

  while (current !== sinkId) {
    const neighbors = neighborsMap[current] || [];

    const valid = neighbors.filter(
      n =>
        n.residualEnergy >= thresholds.minEnergy &&
        n.rssi >= thresholds.minRSSI
    );

    if (!valid.length) return null;

    valid.sort((a, b) => a.hopToSink - b.hopToSink);

    const next = valid[0].id;
    if (visited.has(next)) return null;

    visited.add(next);
    path.push(next);
    current = next;
  }

  return path;
}
