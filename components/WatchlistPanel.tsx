import useSWR from "swr";

export function WatchlistPanel() {
  const { data, mutate } = useSWR("/api/watchlist", (url: string) => fetch(url).then(res => res.json()));

  async function deleteEntry(id: string) {
    await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <h2>Мой watchlist</h2>
      {data?.map((item: any) => (
        <div key={item.id}>
          {item.object_type}: {item.object_value}
          <button onClick={() => deleteEntry(item.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
