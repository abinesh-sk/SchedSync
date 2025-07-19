import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [arrivalTimes, setArrivalTimes] = useState("1 5 0 2 3");
  const [burstTimes, setBurstTimes] = useState("18 24 12 16 20");
  const [priorities, setPriorities] = useState("2 3 1 4 0");
  const [results, setResults] = useState([]);
  const [ganttChart, setGanttChart] = useState([]);
  const [averages, setAverages] = useState({
    turnaroundTime: 0,
    waitingTime: 0,
    responseTime: 0,
  });

  // For Gantt Chart image download
  const ganttRef = useRef(null);

  // Parse a space-separated string into an array of numbers
  const parseInput = (input) => input.split(" ").map(Number);

  const solve = () => {
    const arrivalArray = parseInput(arrivalTimes);
    const burstArray = parseInput(burstTimes);
    const priorityArray = parseInput(priorities);
    let output = [];

    switch (algorithm) {
      case "fcfs":
        output = fcfs(arrivalArray, burstArray);
        break;
      case "sjf":
        output = sjf(arrivalArray, burstArray);
        break;
      case "priority":
        output = priorityScheduling(arrivalArray, burstArray, priorityArray);
        break;
      case "rr":
        output = roundRobin(arrivalArray, burstArray, quantum);
        break;
      default:
        break;
    }

    setResults(output);
    setGanttChart(generateGanttChart(output));
    calculateAverages(output);
  };

  const generateGanttChart = (results) => {
    return results.map((result) => ({
      job: result.job,
      startTime: result.finishTime - result.burstTime,
      finishTime: result.finishTime,
    }));
  };

  const calculateAverages = (results) => {
    let totalTurnaroundTime = 0;
    let totalWaitingTime = 0;
    let totalResponseTime = 0;

    results.forEach((result) => {
      totalTurnaroundTime += result.turnaroundTime;
      totalWaitingTime += result.waitTime;
      totalResponseTime += result.responseTime;
    });

    const count = results.length;
    setAverages({
      turnaroundTime: totalTurnaroundTime / count,
      waitingTime: totalWaitingTime / count,
      responseTime: totalResponseTime / count,
    });
  };

  /* ===================== FCFS ===================== */
  const fcfs = (arrivalTimes, burstTimes) => {
    let results = [];
    let n = arrivalTimes.length;
    let processes = [];

    for (let i = 0; i < n; i++) {
      processes.push({ index: i, arrivalTime: arrivalTimes[i], burstTime: burstTimes[i] });
    }

    // Sort by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;

    for (let i = 0; i < n; i++) {
      const process = processes[i];
      const startTime = Math.max(currentTime, process.arrivalTime);
      const finishTime = startTime + process.burstTime;
      const turnaroundTime = finishTime - process.arrivalTime;
      const waitTime = startTime - process.arrivalTime;
      const responseTime = waitTime;

      results.push({
        job: `P${process.index + 1}`,
        arrivalTime: process.arrivalTime,
        burstTime: process.burstTime,
        finishTime,
        turnaroundTime,
        waitTime,
        responseTime,
      });

      currentTime = finishTime;
    }

    return results;
  };

  /* ===================== SJF ===================== */
  const sjf = (arrivalTimes, burstTimes) => {
    let results = [];
    let n = arrivalTimes.length;
    let finished = Array(n).fill(false);
    let currentTime = 0;
    let completed = 0;

    while (completed < n) {
      let idx = -1;
      let minBurstTime = Infinity;

      for (let i = 0; i < n; i++) {
        if (!finished[i] && arrivalTimes[i] <= currentTime && burstTimes[i] < minBurstTime) {
          minBurstTime = burstTimes[i];
          idx = i;
        }
      }

      if (idx === -1) {
        currentTime++;
        continue;
      }

      const startTime = currentTime;
      const finishTime = startTime + burstTimes[idx];
      const turnaroundTime = finishTime - arrivalTimes[idx];
      const waitTime = startTime - arrivalTimes[idx];
      const responseTime = waitTime;

      results.push({
        job: `P${idx + 1}`,
        arrivalTime: arrivalTimes[idx],
        burstTime: burstTimes[idx],
        finishTime,
        turnaroundTime,
        waitTime,
        responseTime,
      });

      currentTime = finishTime;
      finished[idx] = true;
      completed++;
    }

    return results;
  };

  /* ===================== Priority Scheduling ===================== */
  const priorityScheduling = (arrivalTimes, burstTimes, priorities) => {
    let results = [];
    let n = arrivalTimes.length;
    let finished = Array(n).fill(false);
    let currentTime = 0;
    let completed = 0;

    while (completed < n) {
      let idx = -1;
      let minPriority = Infinity;

      for (let i = 0; i < n; i++) {
        if (!finished[i] && arrivalTimes[i] <= currentTime && priorities[i] < minPriority) {
          minPriority = priorities[i];
          idx = i;
        }
      }

      if (idx === -1) {
        currentTime++;
        continue;
      }

      const startTime = currentTime;
      const finishTime = startTime + burstTimes[idx];
      const turnaroundTime = finishTime - arrivalTimes[idx];
      const waitTime = startTime - arrivalTimes[idx];
      const responseTime = waitTime;

      results.push({
        job: `P${idx + 1}`,
        arrivalTime: arrivalTimes[idx],
        burstTime: burstTimes[idx],
        finishTime,
        turnaroundTime,
        waitTime,
        responseTime,
      });

      currentTime = finishTime;
      finished[idx] = true;
      completed++;
    }

    return results;
  };

  /* ===================== Round Robin ===================== */
  const roundRobin = (arrivalTimes, burstTimes, quantum) => {
    let results = [];
    let n = arrivalTimes.length;
    let remainingBurstTimes = [...burstTimes];
    let currentTime = 0;
    let completed = 0;
    let firstResponseTime = Array(n).fill(-1);
    let queue = [];

    // Enqueue processes that arrive at time 0
    for (let i = 0; i < n; i++) {
      if (arrivalTimes[i] === 0) queue.push(i);
    }

    while (completed < n) {
      if (queue.length === 0) {
        currentTime++;
        for (let i = 0; i < n; i++) {
          if (arrivalTimes[i] <= currentTime && remainingBurstTimes[i] > 0 && !queue.includes(i)) {
            queue.push(i);
          }
        }
        continue;
      }

      const idx = queue.shift();

      if (firstResponseTime[idx] === -1) {
        firstResponseTime[idx] = currentTime - arrivalTimes[idx];
      }

      const executedTime = Math.min(quantum, remainingBurstTimes[idx]);
      remainingBurstTimes[idx] -= executedTime;
      currentTime += executedTime;

      // Enqueue newly available processes
      for (let i = 0; i < n; i++) {
        if (i !== idx && arrivalTimes[i] <= currentTime && remainingBurstTimes[i] > 0 && !queue.includes(i)) {
          queue.push(i);
        }
      }

      if (remainingBurstTimes[idx] === 0) {
        const finishTime = currentTime;
        const turnaroundTime = finishTime - arrivalTimes[idx];
        const waitTime = turnaroundTime - burstTimes[idx];
        const responseTime = firstResponseTime[idx];

        results.push({
          job: `P${idx + 1}`,
          arrivalTime: arrivalTimes[idx],
          burstTime: burstTimes[idx],
          finishTime,
          turnaroundTime,
          waitTime,
          responseTime,
        });

        completed++;
      } else {
        // If not finished, requeue the process
        queue.push(idx);
      }
    }

    return results;
  };

  // ========== CSV Download Functionality ==========
  const handleDownloadCSV = () => {
    if (!results || results.length === 0) return;
    const headers = [
      "Process",
      "Arrival Time",
      "Burst Time",
      "Finish Time",
      "Turnaround Time",
      "Waiting Time",
      "Response Time",
    ];
    const rows = results.map((result) =>
      [
        result.job,
        result.arrivalTime,
        result.burstTime,
        result.finishTime,
        result.turnaroundTime,
        result.waitTime,
        result.responseTime,
      ].join(",")
    );
    // Add averages row
    rows.push(
      [
        "Average",
        "",
        "",
        "",
        averages.turnaroundTime.toFixed(2),
        averages.waitingTime.toFixed(2),
        averages.responseTime.toFixed(2),
      ].join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `scheduling_results_${algorithm}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  };

  // ========== Download Gantt Chart Image ==========
  const handleDownloadGanttImage = async () => {
    if (!ganttRef.current) return;

    // For canvas-based rendering: use html2canvas if available
    // If using SVG, use built-in SVG export
    // Here, we use html2canvas for the ref
    const html2canvas = (await import("html2canvas")).default;
    html2canvas(ganttRef.current, { backgroundColor: "#fff", useCORS: true }).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `gantt_chart_${algorithm}.png`;
      link.click();
    });
  };

  // Display algorithm name for output
  const getAlgorithmName = (algo) => {
    switch (algo) {
      case "fcfs":
        return "First Come First Serve (FCFS)";
      case "sjf":
        return "Shortest Job First (SJF)";
      case "priority":
        return "Priority Scheduling";
      case "rr":
        return "Round Robin (RR)";
      default:
        return "";
    }
  };

  // SVG Download icon
  const DownloadIcon = () => (
    <svg height="20" width="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a.997.997 0 01-1.414 0l-4-4A1 1 0 015.707 9.293L8 11.586V3a1 1 0 011-1zm-7 13a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"/>
    </svg>
  );

  return (
    <div className="container">
      <h1>SchedSync</h1>
      <p className="tagline">Synchronizing Tasks, Maximizing CPU Potential</p>

      <div className="flex-container">
        {/* INPUT SECTION */}
        <div className="input-section input-section-hover">
          <label>Algorithm:</label>
          <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
            <option value="fcfs">First Come First Serve (FCFS)</option>
            <option value="sjf">Shortest Job First (SJF)</option>
            <option value="priority">Priority Scheduling</option>
            <option value="rr">Round Robin (RR)</option>
          </select>

          {algorithm === "rr" && (
            <>
              <label>Quantum (for RR):</label>
              <input
                type="number"
                value={quantum}
                onChange={(e) => setQuantum(Number(e.target.value))}
              />
            </>
          )}

          {algorithm === "priority" && (
            <>
              <label>Priorities (for Priority Scheduling):</label>
              <input
                type="text"
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
              />
            </>
          )}

          <label>Arrival Times:</label>
          <input
            type="text"
            value={arrivalTimes}
            onChange={(e) => setArrivalTimes(e.target.value)}
          />

          <label>Burst Times:</label>
          <input
            type="text"
            value={burstTimes}
            onChange={(e) => setBurstTimes(e.target.value)}
          />

          <button onClick={solve}>Solve</button>
        </div>

        {/* OUTPUT SECTION */}
        <div className="output-section output-section-hover">
          <div className="output-algo-header">
            <span className="output-algo-btn">{getAlgorithmName(algorithm)}</span>
            {/* CSV Download button */}
            <button
              className="csv-download-btn"
              title="Download CSV"
              onClick={handleDownloadCSV}
              style={{ marginLeft: "auto" }}
            >
              <DownloadIcon />
            </button>
          </div>

          <h2>Output</h2>

          {/* Gantt Chart Container with curved border and center alignment */}
          <div className="gantt-chart-container" style={{ position: 'relative' }}>
            {/* Gantt Chart label in top left */}
            <div className="gantt-label-top-left">
              Gantt Chart
              {/* Gantt chart image download button */}
              <button
                className="gantt-download-btn"
                title="Download Gantt Chart as PNG"
                onClick={handleDownloadGanttImage}
              >
                <DownloadIcon />
              </button>
            </div>
            {/* Gantt Chart actual rendering */}
            <div ref={ganttRef} className="gantt-chart-wrapper">
              <div className="gantt-chart">
                {ganttChart.map((item, index) => (
                  <div className="gantt-block" key={index}>
                    <div className="gantt-process">{item.job}</div>
                    {index === 0 && <div className="time-start">{item.startTime}</div>}
                    <div className="time-end">{item.finishTime}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table of results (make it scrollable if overflow) */}
          <div className="results-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  <th>Finish Time</th>
                  <th>Turnaround Time</th>
                  <th>Waiting Time</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index}>
                    <td>{result.job}</td>
                    <td>{result.arrivalTime}</td>
                    <td>{result.burstTime}</td>
                    <td>{result.finishTime}</td>
                    <td>{result.turnaroundTime}</td>
                    <td>{result.waitTime}</td>
                    <td>{result.responseTime}</td>
                  </tr>
                ))}
                {/* Average row */}
                <tr>
                  <td>Average</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{averages.turnaroundTime.toFixed(2)}</td>
                  <td>{averages.waitingTime.toFixed(2)}</td>
                  <td>{averages.responseTime.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;