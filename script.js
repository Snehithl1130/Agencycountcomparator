let rowsCache = [];
let chart;

// COMPARE
function compareJSON() {

  let day1Json, day2Json;

  try {
    day1Json = JSON.parse(document.getElementById("day1").value);
    day2Json = JSON.parse(document.getElementById("day2").value);
  } catch (e) {
    alert("Invalid JSON");
    return;
  }

  const map = new Map();

  day1Json.forEach(a => {
    map.set(a.agencyNumber, Number(a.agentCount));
  });

  rowsCache = [];

  day2Json.forEach(a => {
    const agency = a.agencyNumber;
    const d1 = map.get(agency) || 0;
    const d2 = Number(a.agentCount);
    const diff = d2 - d1;

    if (diff !== 0) {
      rowsCache.push({ agency, d1, d2, diff });
    }
  });

  // descending biggest change first
  rowsCache.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  renderTable(rowsCache);
  renderChart(rowsCache);
}

// TABLE RENDER
function renderTable(data) {

  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No differences</td></tr>`;
    return;
  }

  const frag = document.createDocumentFragment();

  data.forEach(r => {
    const tr = document.createElement("tr");

    let cls = "zero";
    if (r.diff > 0) cls = "pos";
    if (r.diff < 0) cls = "neg";

    tr.innerHTML = `

   <td>${r.agency}</td>
   <td>${r.d1}</td>
   <td>${r.d2}</td>
   <td class="${cls}">${r.diff}</td>
   `;

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}

// SEARCH
document.getElementById("search").addEventListener("input", function () {
  const val = this.value.trim();
  if (!val) { renderTable(rowsCache); return; }
  const filtered = rowsCache.filter(r => r.agency.includes(val));
  renderTable(filtered);
});

// CSV DOWNLOAD
function downloadCSV() {
  if (rowsCache.length === 0) { alert("No data"); return; }

  let csv = "Agency,Day1,Day2,Difference\n";
  rowsCache.forEach(r => {
    csv += `${r.agency},${r.d1},${r.d2},${r.diff}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "agency_diff.csv";
  a.click();
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("light");
}

// CHART
function renderChart(data) {

  const top = data.slice(0, 20);

  const labels = top.map(x => x.agency);
  const d1 = top.map(x => x.d1);
  const d2 = top.map(x => x.d2);

  const ctx = document.getElementById("chart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Day1", data: d1 },
        { label: "Day2", data: d2 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#fff" } } },
      scales: {
        x: { ticks: { color: "#ccc" } },
        y: { ticks: { color: "#ccc" } }
      }
    }
  });
}
