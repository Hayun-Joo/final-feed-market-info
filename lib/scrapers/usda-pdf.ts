import axios from 'axios';
import { analyzePDFWithClaude } from '../ai/pdf-analyzer';

export interface USDAPDFData {
  soybean?: {
    tableData: string;
    translation: string;
    keyPoints: string[];
  };
  corn?: {
    tableData: string;
    translation: string;
    keyPoints: string[];
  };
  wheat?: {
    tableData: string;
    translation: string;
    keyPoints: string[];
  };
}

export async function downloadAndAnalyzeUSDAPDF(): Promise<USDAPDFData> {
  try {
    console.log('Downloading USDA WASDE PDF...');

    // USDA WASDE 보고서 최신 URL
    const pdfUrl = 'https://www.usda.gov/oce/commodity/wasde/latest.pdf';

    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log('PDF downloaded, analyzing...');
    const buffer = Buffer.from(response.data);

    // Claude API로 각 제품별 분석
    const results: USDAPDFData = {};

    try {
      console.log('Analyzing soybean data...');
      const soybeanAnalysis = await analyzePDFWithClaude(buffer, 'soybean');
      results.soybean = {
        tableData: soybeanAnalysis.tableData || '',
        translation: soybeanAnalysis.translation,
        keyPoints: soybeanAnalysis.keyPoints,
      };
    } catch (error) {
      console.error('Soybean analysis error:', error);
    }

    try {
      console.log('Analyzing corn data...');
      const cornAnalysis = await analyzePDFWithClaude(buffer, 'corn');
      results.corn = {
        tableData: cornAnalysis.tableData || '',
        translation: cornAnalysis.translation,
        keyPoints: cornAnalysis.keyPoints,
      };
    } catch (error) {
      console.error('Corn analysis error:', error);
    }

    try {
      console.log('Analyzing wheat data...');
      const wheatAnalysis = await analyzePDFWithClaude(buffer, 'wheat');
      results.wheat = {
        tableData: wheatAnalysis.tableData || '',
        translation: wheatAnalysis.translation,
        keyPoints: wheatAnalysis.keyPoints,
      };
    } catch (error) {
      console.error('Wheat analysis error:', error);
    }

    return results;
  } catch (error) {
    console.error('USDA PDF download/analysis error:', error);
    throw new Error('USDA PDF 데이터를 가져올 수 없습니다.');
  }
}
