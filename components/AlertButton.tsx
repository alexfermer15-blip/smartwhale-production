import { useState } from "react";

export function AlertButton({ address, token }: { address?: string, token?: string }) {
  const [loading, setLoading] = useState(false);
  const [minAmount, setMinAmount] = useState("");
  const [direction, setDirection] = useState<"in" | "out" | "both">("both");

  async function addAlert() {
    setLoading(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        type: address ? "address" : "token",
        target: address || token,
        direction,
        min_amount: minAmount ? Number(minAmount) : null,
      })
    });
    setLoading(false);
    // обработать удачу/ошибку
  }

  return (
    <div>
      <button onClick={addAlert} disabled={loading}>Следить за {address || token}</button>
      <div>
        <label>Direction:</label>
        <select value={direction} onChange={e => setDirection(e.target.value as any)}>
          <option value="both">Both</option>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
      </div>
      <div>
        <label>Min amount:</label>
        <input value={minAmount} onChange={e => setMinAmount(e.target.value)} />
      </div>
    </div>
  );
}
