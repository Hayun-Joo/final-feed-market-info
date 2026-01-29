import { NextRequest, NextResponse } from 'next/server';
import { scrapeFuturesChart, scrapeEthanolCharts, scrapeOilChart, scrapeUSDAReport, scrapeExchangeRate } from '@/lib/scraper';
import { generateMarketSummary } from '@/lib/ai-helper';
import { analyzePDFWithClaude } from '@/lib/ai/pdf-analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3분 타임아웃 (안정성 향상)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let result;

    switch (id) {
      case 'soybean':
        result = await scrapeFuturesChart(
          'https://www.cmegroup.com/apps/cmegroup/widgets/productLibs/esignal-charts.html?type=p&code=ZS&title=Chart+-+Mar+2026+Soybean&venue=0&monthYear=H6&year=2026&exchangeCode=XCBT&interval=1',
          'Soybean'
        );
        // USDA S&D 리포트 자동 다운로드 및 분석
        try {
          console.log('[Soybean] Starting USDA PDF download...');
          const pdfResult = await scrapeUSDAReport('soybean');
          if (pdfResult.success && pdfResult.data.pdfBuffer) {
            console.log('[Soybean] PDF downloaded, analyzing...');
            const pdfAnalysis = await analyzePDFWithClaude(pdfResult.data.pdfBuffer, 'soybean');
            result.data.pdfAnalysis = pdfAnalysis;
            result.data.pdfUrl = pdfResult.data.pdfUrl;
            console.log('[Soybean] PDF analysis complete');
          } else {
            console.error('[Soybean] PDF download failed:', pdfResult.error);
          }
        } catch (pdfError) {
          console.error('[Soybean] USDA PDF scraping failed:', pdfError);
        }
        break;

      case 'corn':
        result = await scrapeFuturesChart(
          'https://www.cmegroup.com/apps/cmegroup/widgets/productLibs/esignal-charts.html?type=p&code=ZC&title=Chart+-+Mar+2026+Corn&venue=0&monthYear=H6&year=2026&exchangeCode=XCBT&interval=1',
          'Corn'
        );
        // USDA S&D 리포트 자동 다운로드 및 분석
        try {
          console.log('[Corn] Starting USDA PDF download...');
          const pdfResult = await scrapeUSDAReport('corn');
          if (pdfResult.success && pdfResult.data.pdfBuffer) {
            console.log('[Corn] PDF downloaded, analyzing...');
            const pdfAnalysis = await analyzePDFWithClaude(pdfResult.data.pdfBuffer, 'corn');
            result.data.pdfAnalysis = pdfAnalysis;
            result.data.pdfUrl = pdfResult.data.pdfUrl;
            console.log('[Corn] PDF analysis complete');
          } else {
            console.error('[Corn] PDF download failed:', pdfResult.error);
          }
        } catch (pdfError) {
          console.error('[Corn] USDA PDF scraping failed:', pdfError);
        }
        break;

      case 'wheat':
        result = await scrapeFuturesChart(
          'https://www.cmegroup.com/apps/cmegroup/widgets/productLibs/esignal-charts.html?type=p&code=ZW&title=Chart+-+Mar+2026+Chicago+SRW+Wheat&venue=0&monthYear=H6&year=2026&exchangeCode=XCBT&interval=1',
          'Wheat'
        );
        // USDA S&D 리포트 자동 다운로드 및 분석
        try {
          console.log('[Wheat] Starting USDA PDF download...');
          const pdfResult = await scrapeUSDAReport('wheat');
          if (pdfResult.success && pdfResult.data.pdfBuffer) {
            console.log('[Wheat] PDF downloaded, analyzing...');
            const pdfAnalysis = await analyzePDFWithClaude(pdfResult.data.pdfBuffer, 'wheat');
            result.data.pdfAnalysis = pdfAnalysis;
            result.data.pdfUrl = pdfResult.data.pdfUrl;
            console.log('[Wheat] PDF analysis complete');
          } else {
            console.error('[Wheat] PDF download failed:', pdfResult.error);
          }
        } catch (pdfError) {
          console.error('[Wheat] USDA PDF scraping failed:', pdfError);
        }
        break;

      case 'ethanol':
        result = await scrapeEthanolCharts();
        break;

      case 'oil':
        result = await scrapeOilChart();
        break;

      case 'exchange':
        result = await scrapeExchangeRate();
        break;

      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 시장입니다' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // AI 요약 생성 (이미지 포함)
    const marketTypeMap: Record<string, string> = {
      soybean: '대두 (Soybean)',
      corn: '옥수수 (Corn)',
      wheat: '소맥 (Wheat)',
      oil: '유가 (Oil Price)',
      ethanol: '에탄올 (Ethanol)',
      exchange: '환율 (USD/KRW)',
    };

    let summary = '';
    try {
      console.log(`[API /scrape/${id}] Generating AI summary...`);
      summary = await generateMarketSummary({
        marketType: marketTypeMap[id] || id,
        currentPrice: result.data.currentPrice,
        tableData: result.data.tableData,
        description: result.data.description,
        imageData: result.data.imageBase64, // 이미지 추가 (Claude Vision으로 분석)
      });
      console.log(`[API /scrape/${id}] AI summary generated successfully`);
    } catch (aiError) {
      console.error(`[API /scrape/${id}] AI summary generation failed:`, aiError);
      summary = '요약 생성 중 오류가 발생했습니다. 데이터는 정상적으로 수집되었습니다.';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        summary,
      },
    });
  } catch (error) {
    console.error(`[API /scrape/${id}] Critical error:`, error);
    console.error(`[API /scrape/${id}] Error stack:`, error instanceof Error ? error.stack : 'N/A');
    console.error(`[API /scrape/${id}] Error details:`, JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : '알 수 없는 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}
