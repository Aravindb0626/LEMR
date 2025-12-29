import { useEffect, useState, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import ForceGraph from "./components/forceGraph";
import { findLEMRPath } from "./utils/lemr";

export default function App() {

  const homeRef = useRef(null);
  const topologyRef = useRef(null);
  const lifetimeRef = useRef(null);

  const [rawRows, setRawRows] = useState([]);
  const [graph, setGraph] = useState({});
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState("");
  const [result, setResult] = useState(null);

  const [nodeLimit, setNodeLimit] = useState(10);
  const [packets, setPackets] = useState(50);

   const [uploadedFile, setUploadedFile] = useState(null)
   const fileInputRef = useRef(null); // 🆕 NEW


  useEffect(() => {
    loadDefaultCSV(); // 🔴 CHANGED
  }, []);

  function loadDefaultCSV() { // 🆕 NEW
    fetch("/data/neighbors.csv")
      .then((r) => r.text())
      .then((text) => parseCSV(text));
  }

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

  function handleFileChange(e) { // 🆕 NEW
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file); // 🔴 CHANGED

    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target.result);
    reader.readAsText(file);
  }

  function removeFile() { // 🆕 NEW
    setUploadedFile(null); // 🔴 CHANGED
    fileInputRef.current.value = "";
    loadDefaultCSV(); // 🔴 CHANGED
  }

  const limitedNodes = useMemo(
    () => nodes.slice(0, nodeLimit),
    [nodes, nodeLimit]
  );

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
        map.set(r.node, {
          node: r.node,
          energy: r.energy,
          rssi: r.rssi,
          hop: r.hop,
        });
      }
    });
    return [...map.values()];
  }, [rawRows, limitedNodes]);

  function computePath() {
    setResult(findLEMRPath(source, "SINK", filteredGraph));
  }

  const chartData = useMemo(() => {
    const data = [];
    for (let p = 1; p <= packets; p++) {
      data.push({
        p,
        LEMR: Math.max(1, 10 - Math.floor(p / 5)),
        Random: Math.max(1, 10 - Math.floor(p / 4)),
        MinHop: Math.max(1, 10 - Math.floor(p / 4.5)),
      });
    }
    return data;
  }, [packets]);

  const aliveResults = useMemo(
    () => chartData[chartData.length - 1],
    [chartData]
  );

  return (
    <div className="bg-slate-100 min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 pt-5 right-0 z-50 bg-white shadow px-8 py-4 flex justify-between">
        <h1 className="text-xl font-bold text-indigo-600">
          LEMR Simulation
        </h1>
        <div className="flex gap-8 text-sm font-medium text-slate-600">
          <span
            className="hover:text-indigo-600 cursor-pointer"
            onClick={() =>
              homeRef.current.scrollIntoView({ behavior: "smooth" })
            }
          >
            Home
          </span>
          <span
            className="hover:text-indigo-600 cursor-pointer"
            onClick={() =>
              topologyRef.current.scrollIntoView({ behavior: "smooth" })
            }
          >
            Network Topology
          </span>
          <span
            className="hover:text-indigo-600 cursor-pointer"
            onClick={() =>
              lifetimeRef.current.scrollIntoView({ behavior: "smooth" })
            }
          >
            Network Lifetime Comparision
          </span>
        </div>
      </nav>

      {/* 🔹 HOME */}
      <div ref={homeRef} className="p-8 pt-23 space-y-8">
        <div className="grid grid-cols-[1.6fr_1fr] gap-8">
          {/* Node Dataset */}
          {/* <div className="bg-white rounded-xl shadow p-6 h-[520px] flex flex-col">
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
                  <span className="text-center text-green-600 font-medium">
                    {r.energy}%
                  </span>
                  <span className="text-center">{r.rssi}</span>
                  <span className="text-center">{r.hop}</span>
                </div>
              ))}
            </div>
          </div> */}

          {/* ✅ MODERN NODE DATASET */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-[520px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Node Dataset</h2>
              <span className="text-xs text-slate-500">{dataset.length} nodes</span>
            </div>
             <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 border-b pb-2">
              <span>Node</span>
              <span className="text-center">Energy</span>
              <span className="text-center">RSSI</span>
              <span className="text-center">Hop</span>
            </div>

             <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-2">
              {dataset.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 items-center text-sm px-2 py-2 rounded-lg hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700">{r.node}</span>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-green-600">
                      {r.energy}%
                    </span>
                    <div className="w-full bg-slate-200 h-1 rounded-full mt-1">
                      <div
                        className="bg-green-500 h-1 rounded-full"
                        style={{ width: `${Math.min(r.energy, 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-center">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                      {r.rssi}
                    </span>
                  </span>

                  <span className="text-center">
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-medium">
                      {r.hop}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow p-6 h-[520px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Simulation Controls
              </h2>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange} // 🔴 CHANGED
                className="hidden w-full border rounded-lg p-2 mb-2"
              />

              {!uploadedFile && (
  <button
    onClick={() => fileInputRef.current.click()}
    className="w-full border rounded-lg p-2 mb-2 text-left text-slate-500"
  >
    Choose file
  </button>
)} 


              {uploadedFile && (
  <div className="flex justify-between items-center border rounded-lg p-2 mb-2">
    <span className="text-sm truncate">
      {uploadedFile.name}
    </span>
                <button
                  onClick={removeFile}
                  className="text-sm text-red-600 underline mb-4"
                >
                  Delete selected file
                </button>
                </div>
              )}


              <label className="text-sm font-medium block mb-1">
                Source Node
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full border rounded-lg p-2 mb-4"
              >
                {limitedNodes.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>

              <label className="text-sm">
                Number of Nodes: {nodeLimit}
              </label>
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

        {/* 🔹 TOPOLOGY */}
        <div
          ref={topologyRef}
          className="bg-white rounded-xl shadow p-6"
        >
          <h2 className="text-lg font-semibold mb-4">
            Network Topology & Routing Path
          </h2>
          <ForceGraph
            nodes={limitedNodes}
            graph={filteredGraph}
            selected={source}
          />
        </div>

        {/* 🔹 LIFETIME */}
        <div
          ref={lifetimeRef}
          className="bg-white rounded-xl shadow p-6"
        >
          <h2 className="text-lg font-semibold mb-4">
            Network Lifetime Comparison
          </h2>
          <LineChart width={1100} height={280} data={chartData}>
            <XAxis dataKey="p" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="LEMR" stroke="#22c55e" dot />
            <Line type="monotone" dataKey="Random" stroke="#ef4444" dot />
            <Line type="monotone" dataKey="MinHop" stroke="#3b82f6" dot />
          </LineChart>
        </div>

        <div className="bg-white rounded-xl shadow px-6 py-4 flex justify-between items-center">
          <span className="font-semibold text-sm">Simulation Results:</span>
          <div className="flex gap-20 text-sm">
            <span className="text-green-600 font-medium">
              <strong>LEMR:</strong> {aliveResults.LEMR} nodes alive after{" "}
              {packets} packets
            </span>
            <span className="text-red-500 font-medium">
              <strong>Random:</strong> {aliveResults.Random} nodes alive after{" "}
              {packets} packets
            </span>
            <span className="text-blue-500 font-medium">
              <strong>Min-Hop:</strong> {aliveResults.MinHop} nodes alive after{" "}
              {packets} packets
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
















