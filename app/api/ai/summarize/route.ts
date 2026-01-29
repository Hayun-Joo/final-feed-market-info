import { NextRequest, NextResponse } from 'next/server';
import { generateMarketSummary } from '@/lib/ai-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { marketType, currentPrice, tableData, description } = body;

    if (!marketType) {
      return NextResponse.json(
        { success: false, error: 'marketType은 필수입니다' },
        { status: 400 }
      );
    }

    const summary = await generateMarketSummary({
      marketType,
      currentPrice,
      tableData,
      description,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
