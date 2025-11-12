import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Calculate time range
    const now = new Date();
    const timeRanges: any = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    const startTime = timeRanges[period];

    // Get transactions count
    const { count: totalTransactions } = await supabase
      .from('whale_transactions')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startTime.toISOString());

    // Get total volume
    const { data: volumeData } = await supabase
      .from('whale_transactions')
      .select('amount_usd')
      .gte('timestamp', startTime.toISOString());

    const totalVolume = volumeData?.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0) || 0;

    // Get active whales
    const { count: activeWhales } = await supabase
      .from('tracked_whales')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('last_synced_at', startTime.toISOString());

    // Get average influence
    const { data: influenceData } = await supabase
      .from('tracked_whales')
      .select('influence_score')
      .eq('is_active', true);

    const avgInfluence =
      influenceData && influenceData.length > 0
        ? influenceData.reduce((sum, w) => sum + (w.influence_score || 0), 0) / influenceData.length
        : 0;

    return NextResponse.json({
      totalTransactions: totalTransactions || 0,
      totalVolume,
      activeWhales: activeWhales || 0,
      avgInfluence,
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
