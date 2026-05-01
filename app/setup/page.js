'use client';
import { useState } from 'react';

export default function Page() {
  const [secret, setSecret] = useState('');
  const [resText, setResText] = useState('');

  async function run() {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret })
    });
    const text = await res.text();
    setResText(text);
  }

  return (
    <div style={{padding:40}}>
      <h1>Setup</h1>
      <input value={secret} onChange={e=>setSecret(e.target.value)} />
      <button onClick={run}>Run</button>
      <pre>{resText}</pre>
    </div>
  );
}
