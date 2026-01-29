import { NextRequest, NextResponse } from 'next/server';
import { analyzePDFWithClaude } from '@/lib/ai/pdf-analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const productType = formData.get('productType') as 'soybean' | 'corn' | 'wheat';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'PDF 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!productType || !['soybean', 'corn', 'wheat'].includes(productType)) {
      return NextResponse.json(
        { success: false, error: '올바른 제품 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    // PDF를 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Claude API로 분석
    const analysis = await analyzePDFWithClaude(buffer, productType);

    return NextResponse.json({
      success: true,
      data: {
        productType,
        fileName: file.name,
        analysis,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PDF 분석 실패',
      },
      { status: 500 }
    );
  }
}
