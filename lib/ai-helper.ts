import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SummaryRequest {
  marketType: string;
  currentPrice?: string;
  tableData?: string;
  description?: string;
  imageData?: string;
}

export async function generateMarketSummary(
  request: SummaryRequest
): Promise<string> {
  try {
    const content: any[] = [];

    // 이미지가 있으면 먼저 추가 (Claude Vision)
    if (request.imageData) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: request.imageData,
        },
      });
    }

    // 텍스트 프롬프트
    let textPrompt = `당신은 한국 배합사료 회사의 원료 시황 분석 전문가입니다.

**중요: 오늘은 2026년 1월 29일입니다. 반드시 2026년 기준으로 분석하세요.**

시장 유형: ${request.marketType}
`;

    if (request.currentPrice) {
      textPrompt += `현재 선물가: ${request.currentPrice}\n`;
    }

    if (request.tableData) {
      textPrompt += `\nS&D 데이터:\n${request.tableData}\n`;
    }

    if (request.description) {
      textPrompt += `\n설명:\n${request.description}\n`;
    }

    textPrompt += `
**분석 지침 (반드시 준수):**
1. ${request.imageData ? '위 차트 이미지를 정확히 분석하여' : '제공된 데이터를 기반으로'} 현재 시장 상황을 파악하세요
2. 최근 가격 추세와 변동을 구체적으로 설명하세요
3. 배합사료 회사 관점에서 핵심 시사점을 제시하세요
4. **절대적 제약: 정확히 3~5줄 이내로만 작성하세요. 6줄 이상 금지!**
   - 불릿 포인트(•) 형식 사용 가능
   - 각 줄은 50자 이내로 간결하게
   - 핵심만 담아서 작성
5. 2024년이나 과거 데이터 언급 금지. 오직 2026년 현재 데이터만
6. 할루시네이션 절대 금지: ${request.imageData ? '차트에서 실제로 보이는 데이터' : '제공된 실제 데이터'}만 분석

**출력 형식 예시:**
• 첫 번째 핵심 포인트 (간결하게)
• 두 번째 핵심 포인트 (간결하게)
• 세 번째 핵심 포인트 (간결하게)

한국어로 작성하고, 3-5줄 제한을 반드시 지켜주세요.`;

    content.push({
      type: 'text',
      text: textPrompt,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return responseText;
  } catch (error) {
    console.error('AI summary generation error:', error);
    return '요약 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
  }
}

export async function chatWithAI(
  question: string,
  context: string
): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `당신은 한국 배합사료 회사의 원료 시황 분석 전문가입니다.

다음은 현재 시장 데이터입니다:
${context}

사용자 질문: ${question}

배합사료 회사 관점에서 전문적이고 실용적인 답변을 한국어로 제공해주세요.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return responseText;
  } catch (error) {
    console.error('AI chat error:', error);
    return '답변 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
  }
}

export async function translateToKorean(text: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `다음 영문 텍스트를 자연스러운 한국어로 번역해주세요:

${text}

번역문만 출력해주세요.`,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return responseText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}
