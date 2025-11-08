import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToCSV(whale: any) {
  const csvData = [
    ['Metric', 'Value'],
    ['Address', whale.address],
    ['Label', whale.label],
    ['ETH Balance', whale.balance],
    ['USD Value', whale.usdValue],
    ['Transactions', whale.transactions],
    ['Last Update', whale.lastUpdate],
    [''],
    ['Portfolio Breakdown'],
    ['Token', 'Balance', 'USD Value'],
    ...(whale.portfolioBreakdown || []).map((token: any) => [
      token.symbol,
      token.balance,
      token.usdValue,
    ]),
  ]

  const csvContent = csvData.map((row) => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `whale-${whale.address.slice(0, 10)}-${Date.now()}.csv`
  link.click()
}

export function exportToPDF(whale: any) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Whale Portfolio Report', 14, 20)

  doc.setFontSize(12)
  doc.text(`Label: ${whale.label}`, 14, 30)
  doc.text(`Address: ${whale.address}`, 14, 37)
  doc.text(`ETH Balance: ${whale.balance.toFixed(2)} ETH`, 14, 44)
  doc.text(`USD Value: $${whale.usdValue.toLocaleString()}`, 14, 51)
  doc.text(`Transactions: ${whale.transactions.toLocaleString()}`, 14, 58)

  autoTable(doc, {
    startY: 70,
    head: [['Token', 'Balance', 'USD Value']],
    body: (whale.portfolioBreakdown || []).map((token: any) => [
      token.symbol,
      token.balance.toFixed(4),
      `$${token.usdValue.toLocaleString()}`,
    ]),
  })

  doc.save(`whale-${whale.address.slice(0, 10)}-${Date.now()}.pdf`)
}
