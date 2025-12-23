export function findLEMRPath(source, sink, graph, limits) {
  let current = source;
  const path = [current];
  const visited = new Set();

  while (current !== sink) {
    visited.add(current);

    const neighbors = (graph[current] || []).filter(n => {
      if (n.to === sink) return true; // always allow sink
      return n.energy >= limits.minEnergy && n.rssi >= limits.minRSSI;
    });

    if (neighbors.length === 0) return null;

    neighbors.sort((a, b) => {
      if (a.hop !== b.hop) return a.hop - b.hop;
      return b.energy - a.energy;
    });

    const next = neighbors[0].to;
    if (visited.has(next)) return null;

    current = next;
    path.push(current);
  }

  return path;
}
