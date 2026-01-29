import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/ai-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, context } = body;

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'question은 필수입니다' },
        { status: 400 }
      );
    }

    const answer = await chatWithAI(question, context || '');

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
