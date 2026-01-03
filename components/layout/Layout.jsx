import React from "react";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: 20,
        color: "#333",
        maxWidth: 1200,
        margin: "0 auto",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
        minHeight: "100vh",
      }}
    >
      <Header />
      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {children}
      </div>
      <footer
        style={{
          textAlign: "center",
          padding: "30px 0",
          color: "#7f8c8d",
          fontSize: "0.85em",
        }}
      >
        <p>Borders Dynasty Web3 DeFi Core</p>
      </footer>
    </div>
  );
}
