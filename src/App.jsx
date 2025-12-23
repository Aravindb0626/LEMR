import { useEffect, useState } from "react";
import { findLEMRPath } from "./utils/lemr";

export default function App() {
  const [graph, setGraph] = useState({});
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState("N1");
  const [minEnergy, setMinEnergy] = useState(16);
  const [minRSSI, setMinRSSI] = useState(-89);
  const [result, setResult] = useState(undefined);

  useEffect(() => {
    fetch("/public/lemr_simulated_neighbors.csv")
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split("\n").slice(1);
        const g = {};
        const set = new Set();

        lines.forEach(row => {
          const [from, to, energy, rssi, hop] = row.split(",");
          set.add(from);
          set.add(to);

          if (!g[from]) g[from] = [];
          g[from].push({
            to,
            energy: Number(energy),
            rssi: Number(rssi),
            hop: Number(hop)
          });
        });

        setNodes([...set].sort());
        setGraph(g);
      });
  }, []);

  function compute() {
    const path = findLEMRPath(
      source,
      "SINK",
      graph,
      { minEnergy, minRSSI }
    );
    setResult(path);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
      <h1 className="text-3xl font-bold text-indigo-600 mb-6">
        LEMR Routing Simulator
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Nodes */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Nodes</h2>
          {nodes.map((node, index) => (
  <button
    key={`${node}-${index}`}   // ✅ guaranteed unique
    onClick={() => setSource(node)}
    className={`block w-full mb-2 py-2 rounded ${
      source === node
        ? "bg-indigo-500 text-white"
        : "bg-slate-100"
    }`}
  >
    {node}
            </button>
          ))}
        </div>

        {/* Neighbors */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-3">Neighbor Links</h2>
          {(graph[source] || []).map(link => (
            <div
              key={`${source}-${link.to}-${link.hop}`}
              className="p-2 mb-2 bg-slate-50 rounded"
            >
              {source} → {link.to} |
              ⚡ {link.energy}% |
              📶 {link.rssi} dBm |
              🧭 Hop {link.hop}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold mb-4">Controls</h2>

          <label>Min Energy: {minEnergy}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={minEnergy}
            onChange={e => setMinEnergy(+e.target.value)}
            className="w-full mb-4"
          />

          <label>Min RSSI: {minRSSI} dBm</label>
          <input
            type="range"
            min="-110"
            max="-60"
            value={minRSSI}
            onChange={e => setMinRSSI(+e.target.value)}
            className="w-full mb-4"
          />

          <button
            onClick={compute}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg"
          >
            Compute Path
          </button>

          <div className="mt-4">
            <h3 className="font-semibold">Result</h3>

            {result === undefined && (
              <p className="text-slate-500">Click “Compute Path”</p>
            )}

            {result === null && (
              <p className="text-red-500">No valid path</p>
            )}

            {Array.isArray(result) && (
              <div>
                <p>Path: {result.join(" → ")}</p>
                <p>Hops: {result.length - 1}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
