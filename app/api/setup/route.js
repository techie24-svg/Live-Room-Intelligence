import { useState } from "react";

export default function SetupPage() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function runSetup() {
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secret }),
      });

      const text = await res.text();

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`API returned non-JSON response: ${text}`);
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Setup failed with status ${res.status}`);
      }

      setResult("✅ Setup completed successfully");
    } catch (err) {
      setResult(`❌ Setup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Database Setup</h1>

      <p>Enter your setup secret to initialize Neon tables.</p>

      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="SETUP_SECRET"
        style={{
          padding: 12,
          width: 320,
          marginRight: 12,
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      />

      <button
        onClick={runSetup}
        disabled={loading}
        style={{
          padding: "12px 18px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Running..." : "Run Setup"}
      </button>

      {result && (
        <pre
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f4f4f4",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </pre>
      )}
    </main>
  );
}
