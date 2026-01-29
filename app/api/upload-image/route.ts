import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const marketInstructions: Record<string, string> = {
  soybean: `이 이미지는 CME Group의 대두(Soybean) 선물 차트입니다.
다음 정보를 추출하고 분석해주세요:
1. 현재 선물가 (c/bu 단위)
2. 가격 변동 (상승/하락)
3. 차트의 주요 추세
4. 배합사료 회사 관점에서 3-5줄 요약`,

  corn: `이 이미지는 CME Group의 옥수수(Corn) 선물 차트입니다.
다음 정보를 추출하고 분석해주세요:
1. 현재 선물가 (c/bu 단위)
2. 가격 변동 (상승/하락)
3. 차트의 주요 추세
4. 배합사료 회사 관점에서 3-5줄 요약`,

  wheat: `이 이미지는 CME Group의 소맥(Wheat) 선물 차트입니다.
다음 정보를 추출하고 분석해주세요:
1. 현재 선물가 (c/bu 단위)
2. 가격 변동 (상승/하락)
3. 차트의 주요 추세
4. 배합사료 회사 관점에서 3-5줄 요약`,

  oil: `이 이미지는 Ship & Bunker의 유가 차트입니다 (Singapore VLSFO + WTI).
다음 정보를 추출하고 분석해주세요:
1. Singapore VLSFO 가격
2. WTI 가격
3. 가격 추세
4. 배합사료 회사 관점에서 3-5줄 요약`,

  ethanol: `이 이미지는 CME Group의 미국 에탄올 시장 데이터입니다.
다음 정보를 추출하고 분석해주세요:
1. Production 데이터
2. Stocks 데이터
3. 주요 변화
4. 배합사료 회사 관점에서 3-5줄 요약`,
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const marketId = formData.get('marketId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!marketId || !marketInstructions[marketId]) {
      return NextResponse.json(
        { success: false, error: '올바른 시장 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지를 Base64로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // 이미지 타입 결정
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    // Claude Vision API로 이미지 분석
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: marketInstructions[marketId],
            },
          ],
        },
      ],
    });

    const analysis = message.content[0];
    const analysisText = analysis.type === 'text' ? analysis.text : '';

    return NextResponse.json({
      success: true,
      data: {
        marketId,
        fileName: file.name,
        imageBase64: base64Image,
        analysis: analysisText,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '이미지 분석 실패',
      },
      { status: 500 }
    );
  }
}
