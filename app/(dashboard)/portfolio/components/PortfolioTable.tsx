// app/(dashboard)/portfolio/components/PortfolioTable.tsx
interface TokenBalance {
  tokenId: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
  avgBuyPrice: number;
  holdingTimeDays: number;
}

interface Props {
  tokens: TokenBalance[];
}

export default function PortfolioTable({ tokens }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Asset</th>
          <th>Amount</th>
          <th>Price</th>
          <th>Value</th>
          <th>24h Change</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t) => (
          <tr key={t.tokenId}>
            <td>{t.tokenId}</td>
            <td>{t.balance}</td>
            <td>${t.priceUsd.toLocaleString()}</td>
            <td>${t.valueUsd.toLocaleString()}</td>
            <td style={{ color: 'green' /* динамика */ }}>+4.13%</td>
            <td><button>Edit</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
