import pdf from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ParsedTableData {
  tableText: string;
  description?: string;
  translation?: string;
  keyPoints?: string[];
}

export async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('PDF 파싱 실패');
  }
}

export async function extractSDTable(
  pdfText: string,
  commodity: 'soybean' | 'corn' | 'wheat'
): Promise<ParsedTableData> {
  const commodityMap = {
    soybean: 'WORLD SOYBEANS',
    corn: 'WORLD CORN',
    wheat: 'WORLD WHEAT',
  };

  const searchTerm = commodityMap[commodity];

  // PDF 텍스트에서 해당 표 섹션 찾기
  const lines = pdfText.split('\n');
  const startIndex = lines.findIndex((line) =>
    line.toUpperCase().includes(searchTerm)
  );

  if (startIndex === -1) {
    throw new Error(`${searchTerm} 표를 찾을 수 없습니다`);
  }

  // 표 데이터 추출 (다음 섹션이 나올 때까지)
  const tableLines: string[] = [];
  const descriptionLines: string[] = [];
  let inTable = true;

  for (let i = startIndex; i < Math.min(startIndex + 100, lines.length); i++) {
    const line = lines[i].trim();

    // 다른 표나 섹션이 시작되면 중단
    if (
      i > startIndex &&
      (line.includes('WORLD') ||
        line.includes('UNITED STATES') ||
        line.includes('SUPPLY AND USE'))
    ) {
      inTable = false;
    }

    if (inTable && line.length > 0) {
      tableLines.push(line);
    } else if (!inTable && line.length > 0 && !line.match(/^\d+$/)) {
      // 표 뒤의 설명 문장 수집
      descriptionLines.push(line);
      if (descriptionLines.length > 10) break; // 최대 10줄
    }
  }

  const tableText = tableLines.join('\n');
  const descriptionText = descriptionLines.slice(0, 5).join(' ');

  // Claude API로 번역 및 요약
  const { translation, keyPoints } = await translateAndSummarize(
    tableText,
    descriptionText
  );

  return {
    tableText,
    description: descriptionText,
    translation,
    keyPoints,
  };
}

async function translateAndSummarize(
  tableText: string,
  description: string
): Promise<{ translation: string; keyPoints: string[] }> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `다음은 USDA Supply & Demand 보고서의 표와 설명입니다.

표 데이터:
${tableText}

설명:
${description}

다음을 수행해주세요:
1. 설명 문장을 한국어로 번역
2. 핵심 내용을 3-5줄로 요약 (한국어)

응답 형식:
번역: [한국어 번역]
---
요약:
- [핵심 포인트 1]
- [핵심 포인트 2]
- [핵심 포인트 3]`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // 응답 파싱
    const parts = responseText.split('---');
    const translation = parts[0]?.replace('번역:', '').trim() || '';
    const summarySection = parts[1] || '';

    const keyPoints = summarySection
      .split('\n')
      .filter((line) => line.trim().startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => line.length > 0);

    return { translation, keyPoints };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translation: '번역 중 오류가 발생했습니다.',
      keyPoints: [],
    };
  }
}

export async function downloadAndParsePDF(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await parsePDFBuffer(buffer);
  } catch (error) {
    console.error('PDF download error:', error);
    throw new Error('PDF 다운로드 실패');
  }
}
