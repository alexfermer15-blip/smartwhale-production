import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Логируем наличие переменных окружения при каждом запуске (можно убрать после отладки)
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING')

// Инициализируем клиент Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Получаем body из запроса
    const body = await request.json()
    console.log('Alert body:', body)

    // Распаковка и простейшая валидация входных данных
    const { walletAddress, alertType, notifyEmail, threshold, targetPrice } = body
    // Оба варианта поддерживаем для совместимости (threshold или targetPrice)
    const finalThreshold = threshold ?? targetPrice

    if (!walletAddress || !alertType || finalThreshold == null) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Формируем payload для записи
    const payload = {
      wallet_address: walletAddress,
      alert_type: alertType,
      threshold: finalThreshold,
      notify_email: notifyEmail || null,
      created_at: new Date().toISOString(),
      is_active: true,
    }
    console.log('Supabase insert:', payload)

    // Пишем в таблицу whale_alerts
    const { data, error } = await supabase
      .from('whale_alerts')
      .insert(payload)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Alert creation error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    )
  }
}

