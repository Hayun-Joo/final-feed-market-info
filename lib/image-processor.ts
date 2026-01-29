import sharp from 'sharp';

interface TextAnnotation {
  text: string;
  x: number;
  y: number;
  color: string;
}

interface ArrowAnnotation {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export async function addAnnotationsToImage(
  imageBase64: string,
  annotations: {
    texts?: TextAnnotation[];
    arrows?: ArrowAnnotation[];
  }
): Promise<string> {
  try {
    // Base64 이미지를 버퍼로 변환
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Sharp로 이미지 로드
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('이미지 크기를 확인할 수 없습니다');
    }

    // SVG 오버레이 생성
    let svgOverlay = `<svg width="${metadata.width}" height="${metadata.height}">`;

    // 화살표 추가
    if (annotations.arrows) {
      annotations.arrows.forEach((arrow) => {
        svgOverlay += `
          <defs>
            <marker id="arrowhead-${arrow.color}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="${arrow.color}" />
            </marker>
          </defs>
          <line x1="${arrow.startX}" y1="${arrow.startY}" x2="${arrow.endX}" y2="${arrow.endY}"
                stroke="${arrow.color}" stroke-width="3" marker-end="url(#arrowhead-${arrow.color})" />
        `;
      });
    }

    // 텍스트 추가
    if (annotations.texts) {
      annotations.texts.forEach((text) => {
        svgOverlay += `
          <text x="${text.x}" y="${text.y}"
                font-family="Arial, sans-serif"
                font-size="24"
                font-weight="bold"
                fill="${text.color}"
                stroke="white"
                stroke-width="2"
                paint-order="stroke">
            ${text.text}
          </text>
        `;
      });
    }

    svgOverlay += '</svg>';

    // 이미지에 오버레이 합성
    const annotatedImage = await image
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    // Base64로 변환하여 반환
    return annotatedImage.toString('base64');
  } catch (error) {
    console.error('Image annotation error:', error);
    // 오류 발생 시 원본 이미지 반환
    return imageBase64;
  }
}

export async function addOilChartAnnotations(
  imageBase64: string
): Promise<string> {
  try {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return imageBase64;
    }

    const width = metadata.width;
    const height = metadata.height;

    // 차트의 중간 부분에 주석 추가 (실제 위치는 차트 구조에 따라 조정 필요)
    const annotations = {
      arrows: [
        {
          startX: width * 0.2,
          startY: height * 0.3,
          endX: width * 0.25,
          endY: height * 0.35,
          color: '#EF4444', // 빨간색
        },
        {
          startX: width * 0.5,
          startY: height * 0.5,
          endX: width * 0.55,
          endY: height * 0.55,
          color: '#10B981', // 초록색
        },
      ],
      texts: [
        {
          text: '초저유황선박유(VLSFO)',
          x: width * 0.15,
          y: height * 0.28,
          color: '#EF4444', // 빨간색
        },
        {
          text: '미국 서부 텍사스 원유(WTI)',
          x: width * 0.4,
          y: height * 0.48,
          color: '#10B981', // 초록색
        },
      ],
    };

    return await addAnnotationsToImage(imageBase64, annotations);
  } catch (error) {
    console.error('Oil chart annotation error:', error);
    return imageBase64;
  }
}
