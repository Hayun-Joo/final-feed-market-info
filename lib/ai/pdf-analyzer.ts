import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PDFAnalysisResult {
  translation: string;
  keyPoints: string[];
  rawText: string;
  tableData?: string;
}

export async function analyzePDFWithClaude(
  pdfBuffer: Buffer,
  productType: 'soybean' | 'corn' | 'wheat'
): Promise<PDFAnalysisResult> {
  const base64PDF = pdfBuffer.toString('base64');

  const productNames: Record<string, string> = {
    soybean: '대두(WORLD SOYBEANS S&D)',
    corn: '옥수수(WORLD CORN S&D)',
    wheat: '소맥(WORLD WHEAT S&D)',
  };

  const productName = productNames[productType];

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64PDF,
            },
          },
          {
            type: 'text',
            text: `이 USDA Supply & Demand 보고서에서 ${productName} 관련 정보를 추출하고 분석해주세요.

다음 형식으로 답변해주세요:

1. **표 데이터**: WORLD ${productType.toUpperCase()} S&D 표의 주요 데이터를 정리해주세요.

2. **설명 번역**: 표 옆이나 보고서에 있는 영문 설명을 한국어로 번역해주세요.

3. **핵심 요약**: 배합사료 원료 구매 담당자가 알아야 할 핵심 내용을 3-5개 불릿 포인트로 요약해주세요.

형식:
---표 데이터---
[표의 주요 수치와 정보]

---설명 번역---
[영문 설명의 한국어 번역]

---핵심 요약---
• [포인트 1]
• [포인트 2]
• [포인트 3]
• [포인트 4]
• [포인트 5]`,
          },
        ],
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('예상치 못한 응답 형식입니다.');
  }

  const responseText = content.text;

  // 응답 파싱
  const tableMatch = responseText.match(/---표 데이터---([\s\S]*?)---설명 번역---/);
  const translationMatch = responseText.match(/---설명 번역---([\s\S]*?)---핵심 요약---/);
  const keyPointsMatch = responseText.match(/---핵심 요약---([\s\S]*?)$/);

  const tableData = tableMatch ? tableMatch[1].trim() : '';
  const translation = translationMatch ? translationMatch[1].trim() : '';
  const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : '';

  // 불릿 포인트 추출
  const keyPoints = keyPointsText
    .split('\n')
    .filter((line) => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .map((line) => line.replace(/^[•\-]\s*/, '').trim())
    .filter((line) => line.length > 0);

  return {
    translation,
    keyPoints,
    rawText: responseText,
    tableData,
  };
}
