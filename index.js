// 👑 Borders Dynasty Frontend Entry
console.log("👑 Borders Dynasty Frontend Initialized");

// Dynamically fetch royal status from backend
async function fetchRoyalStatus() {
  try {
    const res = await fetch("/royal");
    const data = await res.json();

    const root = document.getElementById("app");
    root.innerHTML = `
      <h1>${data.king}</h1>
      <p><strong>Current Block:</strong> ${data.codexChain.currentBlock}</p>
      <p><strong>Contract Address:</strong> ${data.codexChain.contractAddress}</p>
      <p><strong>Webhook Status:</strong> ${data.codexChain.webhookStatus}</p>
      <p><em>Last updated:</em> ${new Date(data.timestamp).toLocaleString()}</p>
    `;
  } catch (err) {
    console.error("Failed to fetch royal status:", err);
  }
}

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  const app = document.createElement("div");
  app.id = "app";
  app.innerHTML = "<p>Loading royal status...</p>";
  document.body.appendChild(app);

  fetchRoyalStatus();
});
