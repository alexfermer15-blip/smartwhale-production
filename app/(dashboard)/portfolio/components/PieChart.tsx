// app/(dashboard)/portfolio/components/PieChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type PieData = { name: string; value: number; color: string };

interface Props {
  data: PieData[];
}

const COLORS = ['#FFD600', '#3AA6FF', '#A875FF']; // Bitcoin, Ethereum, Solana

export default function PortfolioPieChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%" innerRadius={60} outerRadius={100}
          fill="#8884d8" dataKey="value" label
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
