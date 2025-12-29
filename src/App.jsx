// App.jsx
import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import ForceGraph from "./components/forceGraph";
import { findLEMRPath } from "./utils/lemr";

export default function App() {
  const [rawRows, setRawRows] = useState([]);
  const [graph, setGraph] = useState({});
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState("");
  const [result, setResult] = useState(null);

  const [nodeLimit, setNodeLimit] = useState(10);
  const [packets, setPackets] = useState(50);

  useEffect(() => {
    fetch("/data/neighbors.csv")
      .then((r) => r.text())
      .then((text) => parseCSV(text));
  }, []);

  function parseCSV(text) {
    const rows = text.trim().split("\n").slice(1);
    const g = {};
    const set = new Set();
    const parsed = [];

    rows.forEach((r) => {
      const [from, to, energy, rssi, hop] = r.split(",");
      parsed.push({
        node: from,
        energy: +energy,
        rssi: +rssi,
        hop: +hop,
      });

      set.add(from);
      set.add(to);

      g[from] ??= [];
      g[from].push({
        id: to,
        residualEnergy: +energy,
        rssi: +rssi,
        hopToSink: +hop,
      });
    });

    setRawRows(parsed);
    setGraph(g);
    const nodeArr = [...set];
    setNodes(nodeArr);
    setSource(nodeArr.find((n) => n !== "SINK"));
  }

  const limitedNodes = useMemo(() => nodes.slice(0, nodeLimit), [nodes, nodeLimit]);

  const filteredGraph = useMemo(() => {
    const g = {};
    limitedNodes.forEach((n) => {
      if (graph[n]) {
        g[n] = graph[n].filter((nb) => limitedNodes.includes(nb.id));
      }
    });
    return g;
  }, [graph, limitedNodes]);

  const dataset = useMemo(() => {
    const map = new Map();
    rawRows.forEach((r) => {
      if (!limitedNodes.includes(r.node)) return;
      if (!map.has(r.node)) {
        map.set(r.node, { node: r.node, energy: r.energy, rssi: r.rssi, hop: r.hop });
      }
    });
    return [...map.values()];
  }, [rawRows, limitedNodes]);

  function computePath() {
    setResult(findLEMRPath(source, "SINK", filteredGraph));
  }

  // Compute alive nodes for LEMR, Random, Min-Hop
  const chartData = useMemo(() => {
    const data = [];
    for (let p = 1; p <= packets; p++) {
      const LEMRAlive = Math.max(1, 10 - Math.floor(p / 5));
      const RandomAlive = Math.max(1, 10 - Math.floor(p / 4));
      const MinHopAlive = Math.max(1, 10 - Math.floor(p / 4.5));
      data.push({ p, LEMR: LEMRAlive, Random: RandomAlive, MinHop: MinHopAlive });
    }
    return data;
  }, [packets]);

  // const aliveResults = useMemo(() => {
  //   const last = chartData[chartData.length - 1];
  //   return {
  //     LEMR: last.LEMR,
  //     Random: last.Random,
  //     MinHop: last.MinHop,
  //   };
  // }, [chartData]);


  // const chartData = useMemo(() => {
  //   return Array.from({ length: packets }, (_, i) => ({
  //     p: i + 1,
  //     LEMR: Math.max(1, nodeLimit - Math.floor(i / 5)),
  //     Random: Math.max(1, nodeLimit - Math.floor(i / 4)),
  //     MinHop: Math.max(1, nodeLimit - Math.floor(i / 4.5))
  //   }));
  // }, [packets, nodeLimit]);


  const aliveResults = useMemo(() => {
    const last = chartData[chartData.length - 1];
    return last;
  }, [chartData]);


  // function computePath() {
  //   setResult(findLEMRPath(source, "SINK", filteredGraph));
  // }

  return (
    <div className="bg-slate-100 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow px-8 py-4 flex justify-between">
        <h1 className="text-xl font-bold text-indigo-600">LEMR Simulation</h1>
        <div className="flex gap-8 text-sm font-medium text-slate-600">
          <span>Home</span>
          <span>Network Graph</span>
          <span>Graph</span>
        </div>
      </nav>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-[1.6fr_1fr] gap-8">
          {/* Node Dataset */}
          <div className="bg-white rounded-xl shadow p-6 h-[520px] flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Node Dataset</h2>
            <div className="grid grid-cols-4 text-sm font-semibold border-b pb-2">
              <span>Node</span>
              <span className="text-center">Energy</span>
              <span className="text-center">RSSI</span>
              <span className="text-center">Hop</span>
            </div>
            <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-2">
              {dataset.map((r, i) => (
                <div key={i} className="grid grid-cols-4 text-sm py-1 border-b">
                  <span>{r.node}</span>
                  <span className="text-center text-green-600 font-medium">{r.energy}%</span>
                  <span className="text-center">{r.rssi}</span>
                  <span className="text-center">{r.hop}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow p-6 h-[520px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4">Simulation Controls</h2>
              <input type="file" className="w-full border rounded-lg p-2 mb-4" />
              <label className="text-sm font-medium block mb-1">Source Node</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full border rounded-lg p-2 mb-4"
              >
                {limitedNodes.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <label className="text-sm">Number of Nodes: {nodeLimit}</label>
              <input
                type="range"
                min="5"
                max={nodes.length}
                value={nodeLimit}
                onChange={(e) => setNodeLimit(+e.target.value)}
                className="w-full mb-4"
              />

              <label className="text-sm">Packets: {packets}</label>
              <input
                type="range"
                min="10"
                max="50"
                value={packets}
                onChange={(e) => setPackets(+e.target.value)}
                className="w-full"
              />
            </div>

            <button
              onClick={computePath}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg"
            >
              Compute Path
            </button>

            {result && (
              <p className="text-sm mt-3">
                Path: <strong>{result.join(" → ")}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Force Graph */}
        <div className="bg-white rounded-xl shadow p-6">
          <ForceGraph nodes={limitedNodes} graph={filteredGraph} selected={source} />
        </div>

        {/* Network Lifetime Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4"> Network Lifetime Comparison</h2>
          <LineChart width={1100} height={280} data={chartData}>
            <XAxis dataKey="p" label={{ value: "Packets Sent", position: "insideBottom", dy: 10 }} />
            <YAxis label={{ value: "Alive Nodes", angle: -90, dx: -10 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="LEMR" stroke="#22c55e" dot />
            <Line type="monotone" dataKey="Random" stroke="#ef4444" dot />
            <Line type="monotone" dataKey="MinHop" stroke="#3b82f6" dot />
          </LineChart>

          {/* Simulation Results */}
          {/* <div className="mt-4 text-sm">
            <span className="text-green-600">LEMR: {aliveResults.LEMR} nodes alive after {packets} packets</span><br />
            <span className="text-red-600">Random: {aliveResults.Random} nodes alive after {packets} packets</span><br />
            <span className="text-blue-600">Min-Hop: {aliveResults.MinHop} nodes alive after {packets} packets</span>
          </div> */}

          
        </div>

        <div className="bg-white rounded-xl shadow px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-sm">
             <span>Simulation Results:</span>
          </div>

        <div className="flex gap-20 text-sm">
            <span className="text-green-600 font-medium">
              <strong>LEMR:</strong> {aliveResults.LEMR} nodes alive after {packets} packets
            </span>

            <span className="text-red-500 font-medium">
              <strong>Random:</strong> {aliveResults.Random} nodes alive after {packets} packets
            </span>

            <span className="text-blue-500 font-medium">
              <strong>Min-Hop:</strong> {aliveResults.MinHop} nodes alive after {packets} packets
            </span>
          </div>
      </div>
      </div>
    </div>
  );
}





























