const API_URL = "../docs/sample_alerts.json"; // later: "http://<nids-host>:8000/alerts?label=all"

async function loadAlerts() {
  const status = document.getElementById("status");
  const table = document.getElementById("alerts");
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = data.alerts.map(a => `
      <tr>
        <td>${a.id}</td>
        <td>${new Date(a.timestamp * 1000).toLocaleString()}</td>
        <td>${a.src_ip}</td><td>${a.dst_ip}</td>
        <td>${a.protocol_type}</td><td>${a.service}</td>
        <td>${a.flag}</td><td>${a.predicted_label}</td>
      </tr>`).join("");
    table.querySelector("tbody").innerHTML = rows;
    table.hidden = false;
    status.textContent = `${data.count} alerts`;
  } catch (err) {
    status.textContent = `Failed to load alerts: ${err.message}`;
  }
}
loadAlerts();