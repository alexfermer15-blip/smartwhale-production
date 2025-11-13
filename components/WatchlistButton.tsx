import { useState } from "react";

export function WatchlistButton({ objectType, objectValue }: { objectType: string, objectValue: string }) {
  const [loading, setLoading] = useState(false);

  async function addToWatchlist() {
    setLoading(true);
    await fetch("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({
        object_type: objectType,
        object_value: objectValue,
      })
    });
    setLoading(false);
    // обновить UI/стейт
  }

  return <button onClick={addToWatchlist} disabled={loading}>В избранное</button>;
}
