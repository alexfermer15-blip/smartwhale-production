import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY!

interface Alert {
  id: string
  user_id: string
  whale_address: string
  whale_label: string
  alert_type: 'balance_increase' | 'balance_decrease' | 'large_transaction'
  threshold_value: number
  is_active: boolean
}

export async function GET(request: Request) {
  try {
    // Получаем все активные алерты
    const { data: alerts, error } = await supabase
      .from('whale_alerts')
      .select('*')
      .eq('is_active', true)

    if (error) throw error

    const triggeredAlerts: any[] = []

    for (const alert of alerts as Alert[]) {
      const triggered = await checkAlert(alert)
      if (triggered) {
        triggeredAlerts.push(triggered)
        
        // Сохраняем уведомление в БД
        await saveNotification(alert, triggered)
      }
    }

    return NextResponse.json({
      success: true,
      checked: alerts?.length || 0,
      triggered: triggeredAlerts.length,
      alerts: triggeredAlerts,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check alerts' }, { status: 500 })
  }
}

async function checkAlert(alert: Alert) {
  try {
    // Получаем текущий баланс
    const balanceResponse = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${alert.whale_address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    )
    const balanceData = await balanceResponse.json()
    const currentBalance = parseFloat(balanceData.result) / 1e18

    // Получаем исторический баланс (24 часа назад)
    const blockNumberResponse = await fetch(
      `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${Math.floor(Date.now() / 1000) - 86400}&closest=before&apikey=${ETHERSCAN_API_KEY}`
    )
    const blockNumberData = await blockNumberResponse.json()
    const blockNumber = blockNumberData.result

    const historicalBalanceResponse = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${alert.whale_address}&tag=${blockNumber}&apikey=${ETHERSCAN_API_KEY}`
    )
    const historicalBalanceData = await historicalBalanceResponse.json()
    const historicalBalance = parseFloat(historicalBalanceData.result) / 1e18

    // Вычисляем изменение в процентах
    const changePercent = ((currentBalance - historicalBalance) / historicalBalance) * 100

    // Проверяем условия алерта
    if (alert.alert_type === 'balance_increase' && changePercent >= alert.threshold_value) {
      return {
        alert_id: alert.id,
        type: 'balance_increase',
        message: `${alert.whale_label} balance increased by ${changePercent.toFixed(2)}%`,
        current_balance: currentBalance,
        previous_balance: historicalBalance,
        change_percent: changePercent,
      }
    }

    if (alert.alert_type === 'balance_decrease' && Math.abs(changePercent) >= alert.threshold_value && changePercent < 0) {
      return {
        alert_id: alert.id,
        type: 'balance_decrease',
        message: `${alert.whale_label} balance decreased by ${Math.abs(changePercent).toFixed(2)}%`,
        current_balance: currentBalance,
        previous_balance: historicalBalance,
        change_percent: changePercent,
      }
    }

    // Проверка на крупные транзакции
    if (alert.alert_type === 'large_transaction') {
      const txResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${alert.whale_address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${ETHERSCAN_API_KEY}`
      )
      const txData = await txResponse.json()
      const recentTxs = txData.result || []

      // Проверяем транзакции за последний час
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600
      const largeTx = recentTxs.find((tx: any) => {
        const value = parseFloat(tx.value) / 1e18
        return parseInt(tx.timeStamp) > oneHourAgo && value > currentBalance * (alert.threshold_value / 100)
      })

      if (largeTx) {
        return {
          alert_id: alert.id,
          type: 'large_transaction',
          message: `${alert.whale_label} made a large transaction: ${(parseFloat(largeTx.value) / 1e18).toFixed(2)} ETH`,
          tx_hash: largeTx.hash,
          tx_value: parseFloat(largeTx.value) / 1e18,
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error checking alert:', error)
    return null
  }
}

async function saveNotification(alert: Alert, triggered: any) {
  try {
    await supabase.from('whale_notifications').insert([
      {
        user_id: alert.user_id,
        alert_id: alert.id,
        whale_address: alert.whale_address,
        whale_label: alert.whale_label,
        notification_type: triggered.type,
        message: triggered.message,
        data: triggered,
        created_at: new Date().toISOString(),
      },
    ])
  } catch (error) {
    console.error('Error saving notification:', error)
  }
}
