import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateSummary(context: string, dataType: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음은 ${dataType} 시장 데이터입니다. 이 데이터를 분석하여 핵심 내용을 한국어로 3-5줄로 요약해주세요. 배합사료 회사의 원료 구매 담당자가 이해하기 쉽게 설명해주세요.\n\n데이터:\n${context}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  return '요약을 생성할 수 없습니다.';
}

export async function chatWithData(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  dataContext: string
): Promise<string> {
  const systemPrompt = `당신은 배합사료 원료 시장 전문가입니다. 다음 데이터를 바탕으로 사용자의 질문에 답변해주세요:\n\n${dataContext}\n\n한국어로 친절하고 전문적으로 답변해주세요.`;

  const anthropicMessages = messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  return '응답을 생성할 수 없습니다.';
}

export async function translateAndSummarize(text: string): Promise<{
  translation: string;
  keyPoints: string[];
}> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음 영문 텍스트를 한국어로 번역하고, 핵심 내용을 3-5개의 불릿 포인트로 요약해주세요.\n\n텍스트:\n${text}\n\n응답 형식:\n번역: [한국어 번역]\n핵심내용:\n- [포인트 1]\n- [포인트 2]\n- [포인트 3]`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    const responseText = content.text;
    const lines = responseText.split('\n');

    let translation = '';
    const keyPoints: string[] = [];
    let inKeyPoints = false;

    for (const line of lines) {
      if (line.startsWith('번역:')) {
        translation = line.replace('번역:', '').trim();
      } else if (line.includes('핵심내용') || line.includes('핵심 내용')) {
        inKeyPoints = true;
      } else if (inKeyPoints && line.trim().startsWith('-')) {
        keyPoints.push(line.trim().substring(1).trim());
      } else if (inKeyPoints && line.trim()) {
        translation += ' ' + line.trim();
      }
    }

    return { translation, keyPoints };
  }

  return { translation: '', keyPoints: [] };
}
