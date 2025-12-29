

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function ForceGraph({ nodes, graph, selected }) {
  const ref = useRef();

  useEffect(() => {
    if (!nodes.length) return;

    const width = 900;
    const height = 520;

    d3.select(ref.current).selectAll("*").remove();

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", height);

    const nodeData = nodes.map(n => ({ id: n }));
    const nodeSet = new Set(nodes);

    const linkData = Object.entries(graph).flatMap(([from, list]) =>
      list
        .filter(nb => nodeSet.has(nb.id))
        .map(nb => ({ source: from, target: nb.id }))
    );

    const sim = d3.forceSimulation(nodeData)
      .force("link", d3.forceLink(linkData).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#cbd5e1")
      .selectAll("line")
      .data(linkData)
      .enter()
      .append("line");

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodeData)
      .enter()
      .append("circle")
      .attr("r", d => (d.id === "SINK" ? 18 : 13))
      .attr("fill", d =>
        d.id === "SINK"
          ? "#ef4444"
          : d.id === selected
          ? "#1e40af"
          : "#38bdf8"
      );

    const label = svg.append("g")
      .selectAll("text")
      .data(nodeData)
      .enter()
      .append("text")
      .text(d => d.id)
      .attr("font-size", "11px")
      .attr("dx", 14)
      .attr("dy", 4);

    sim.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("cx", d => d.x).attr("cy", d => d.y);
      label.attr("x", d => d.x).attr("y", d => d.y);
    });
  }, [nodes, graph, selected]);

  return <svg ref={ref} className="mx-auto" />;
}
