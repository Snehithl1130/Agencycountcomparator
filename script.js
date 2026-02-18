let rowsCache = [];
let chart;
let day2RawData = {};

// SUM duplicates
function normalizeData(arr, storeRaw = false) {
  const map = new Map();

  arr.forEach(a => {
    const agency = String(a.agencyNumber).trim();
    const count = Number(a.agentCount) || 0;

    if (storeRaw) day2RawData[agency] = a;

    map.set(agency, (map.get(agency) || 0) + count);
  });
  return map;
}

// COMPARE
function compareJSON() {
  let day1Json, day2Json;

  try {
    day1Json = JSON.parse(document.getElementById("day1").value);
    day2Json = JSON.parse(document.getElementById("day2").value);
  } catch (e) { alert("Invalid JSON"); return; }

  day2RawData = {};

  const day1Map = normalizeData(day1Json);
  const day2Map = normalizeData(day2Json, true);

  rowsCache = [];

  const all = new Set([...day1Map.keys(), ...day2Map.keys()]);

  all.forEach(a => {
    const d1 = day1Map.get(a) || 0;
    const d2 = day2Map.get(a) || 0;
    const diff = d2 - d1;
    if (diff !== 0) rowsCache.push({ agency: a, d1, d2, diff });
  });

  rowsCache.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  renderTable(rowsCache);
  renderChart(rowsCache);
}

// POPUP
function showAgencyDetails(agency) {
  const data = day2RawData[agency];
  if (!data) return;

  const existing = document.getElementById("popup");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.id = "popup";

  div.innerHTML = `
<div class="popup-overlay">
<div class="popup-box">
<h3>Agency ${agency}</h3>
<pre>${JSON.stringify(data, null, 2)}</pre>

<div class="popup-actions">
<input id="pathBox" value="${data.feedFileName}" readonly>
<button onclick="copyPath()">Copy Path</button>
<button onclick="closePopup()">Close</button>
</div>

</div>
</div>
`;

  document.body.appendChild(div);
}

function copyPath() {
  const v = document.getElementById("pathBox").value;
  navigator.clipboard.writeText(v);
  alert("Path copied");
}

function closePopup() {
  document.getElementById("popup").remove();
}

// TABLE
function renderTable(data) {
  const tbody = document.getElementById("resultBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No differences</td></tr>`;
    return;
  }

  data.forEach(r => {
    let cls = "zero";
    if (r.diff > 0) cls = "pos";
    if (r.diff < 0) cls = "neg";

    const tr = document.createElement("tr");
    tr.innerHTML = `
<td>
<a href="#" onclick="showAgencyDetails('${r.agency}')" style="color:#3b82f6;font-weight:600;">
${r.agency}
</a>
</td>
<td>${r.d1}</td>
<td>${r.d2}</td>
<td class="${cls}">${r.diff}</td>
`;
    tbody.appendChild(tr);
  });
}

// SEARCH
document.getElementById("search").addEventListener("input", function () {
  const v = this.value.trim().toLowerCase();
  if (!v) { renderTable(rowsCache); return; }
  renderTable(rowsCache.filter(r => r.agency.toLowerCase().includes(v)));
});

// CSV
function downloadCSV() {
  if (rowsCache.length === 0) { alert("No data"); return; }
  let csv = "Agency,Day1,Day2,Difference\n";
  rowsCache.forEach(r => csv += `${r.agency},${r.d1},${r.d2},${r.diff}\n`);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "agency_diff.csv"; a.click();
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("light");
  if (rowsCache.length > 0) renderChart(rowsCache);
}

// CHART
function renderChart(data) {
  const top = data.slice(0, 20);
  const labels = top.map(x => x.agency);
  const d1 = top.map(x => x.d1);
  const d2 = top.map(x => x.d2);

  const ctx = document.getElementById("chart").getContext("2d");

  const isLight = document.body.classList.contains("light");
  const textColor = isLight ? "#020617" : "#e5e7eb";
  const gridColor = isLight ? "#cbd5e1" : "#374151";

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Day 1", data: d1, backgroundColor: "#3b82f6" },
        { label: "Day 2", data: d2, backgroundColor: "#22c55e" }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: textColor } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });
}
