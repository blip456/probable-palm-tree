"use client";

import { useState } from "react";

type StoredMessage = {
  name: string;
  message: string;
  createdAt: string;
};

export default function Home() {
  return (
    <main>
      <header>
        <h1>Passphrase Messages</h1>
        <p>
          Submit your name and a message to receive a passphrase. Use that
          passphrase later to retrieve the data from the backend.
        </p>
      </header>

      <SendForm />
      <RetrieveForm />
    </main>
  );
}

function SendForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [passphrase, setPassphrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPassphrase(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setPassphrase(data.passphrase);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Send data</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />

        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything you want to store…"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Sending…" : "Send"}
        </button>
      </form>

      {passphrase && (
        <div className="notice success">
          <div>Saved! Your passphrase is:</div>
          <div className="passphrase">{passphrase}</div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            Keep it safe — you&apos;ll need it to retrieve this data.
          </div>
        </div>
      )}

      {error && <div className="notice error">{error}</div>}
    </section>
  );
}

function RetrieveForm() {
  const [passphrase, setPassphrase] = useState("");
  const [result, setResult] = useState<StoredMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/messages/${encodeURIComponent(passphrase.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setResult(data as StoredMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Fetch data</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="passphrase">Passphrase</label>
        <input
          id="passphrase"
          type="text"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="e.g. brave-amber-otter-72"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </form>

      {result && (
        <div className="result">
          <div className="meta">
            From <strong>{result.name}</strong> ·{" "}
            {new Date(result.createdAt).toLocaleString()}
          </div>
          <div className="body">{result.message}</div>
        </div>
      )}

      {error && <div className="notice error">{error}</div>}
    </section>
  );
}
