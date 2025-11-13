import useSWR from "swr";

export function AlertsPanel() {
  const { data, mutate } = useSWR("/api/alerts", url => fetch(url).then(res => res.json()));

  async function deleteAlert(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <h2>Мои алерты</h2>
      {data?.map((alert: any) => (
        <div key={alert.id}>
          {alert.type}: {alert.target} ({alert.direction})
          <button onClick={() => deleteAlert(alert.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
