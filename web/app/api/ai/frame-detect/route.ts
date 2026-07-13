import { NextResponse } from 'next/server';

import type { AiFrameDetectRequest, AiFrameDetectResponse } from '@/types/ai-frame';

type GeminiFrameResponse = {
  confidence?: number;
  endX?: number;
  endY?: number;
  found?: boolean;
  message?: string;
  startX?: number;
  startY?: number;
};

const MIN_REGION_SIZE = 0.01;

function jsonResponse(body: AiFrameDetectResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function isValidRegion(region: Required<Pick<GeminiFrameResponse, 'endX' | 'endY' | 'startX' | 'startY'>>) {
  const values = [region.startX, region.startY, region.endX, region.endY];

  return (
    values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1) &&
    region.endX - region.startX >= MIN_REGION_SIZE &&
    region.endY - region.startY >= MIN_REGION_SIZE
  );
}

function normalizeRegion(result: GeminiFrameResponse) {
  const startX = Number(result.startX);
  const startY = Number(result.startY);
  const endX = Number(result.endX);
  const endY = Number(result.endY);
  const region = {
    endX: Math.max(startX, endX),
    endY: Math.max(startY, endY),
    startX: Math.min(startX, endX),
    startY: Math.min(startY, endY),
  };

  if (!isValidRegion(region)) {
    return null;
  }

  return region;
}

function parseGeminiJson(text: string): GeminiFrameResponse | null {
  try {
    return JSON.parse(text) as GeminiFrameResponse;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]) as GeminiFrameResponse;
    } catch {
      return null;
    }
  }
}

async function fetchImageAsInlineData(imageUrl: string) {
  const imageResponse = await fetch(imageUrl, { cache: 'no-store' });

  if (!imageResponse.ok) {
    throw new Error('Unable to fetch the preview image.');
  }

  const mimeType = imageResponse.headers.get('content-type')?.split(';')[0] || 'image/png';
  const arrayBuffer = await imageResponse.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');

  return { data, mimeType };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return jsonResponse(
      {
        found: false,
        message: 'GEMINI_API_KEY is not configured.',
      },
      500,
    );
  }

  let payload: AiFrameDetectRequest;
  try {
    payload = (await request.json()) as AiFrameDetectRequest;
  } catch {
    return jsonResponse({ found: false, message: 'Invalid request body.' }, 400);
  }

  const imageUrl = payload.imageUrl?.trim();
  const objectName = payload.objectName?.trim();

  if (!imageUrl || !objectName) {
    return jsonResponse(
      {
        found: false,
        message: 'Image URL and object name are required.',
      },
      400,
    );
  }

  try {
    const image = await fetchImageAsInlineData(imageUrl);
    const prompt = [
      `Hãy dựa vào ảnh và xác định khu vực của "${objectName}".`,
      'Trả về đúng một JSON object, không markdown, không giải thích.',
      'Các tọa độ phải được chuẩn hóa theo ảnh từ 0 đến 1.',
      'startX/startY là góc trên trái, endX/endY là góc dưới phải của hình chữ nhật bao quanh đối tượng.',
      'Nếu không tìm thấy đối tượng, trả về {"found":false,"message":"Object not found"}.',
    ].join(' ');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    data: image.data,
                    mime_type: image.mimeType,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                confidence: { type: 'NUMBER' },
                endX: { type: 'NUMBER' },
                endY: { type: 'NUMBER' },
                found: { type: 'BOOLEAN' },
                message: { type: 'STRING' },
                startX: { type: 'NUMBER' },
                startY: { type: 'NUMBER' },
              },
              required: ['found'],
            },
          },
        }),
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    );

    if (!geminiResponse.ok) {
      return jsonResponse(
        {
          found: false,
          message: 'Gemini could not detect the object.',
        },
        502,
      );
    }

    const geminiJson = await geminiResponse.json();
    const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    const result = typeof text === 'string' ? parseGeminiJson(text) : null;

    if (!result?.found) {
      return jsonResponse({
        found: false,
        message: result?.message || 'Object not found.',
      });
    }

    const region = normalizeRegion(result);
    if (!region) {
      return jsonResponse(
        {
          found: false,
          message: 'Gemini returned an invalid frame region.',
        },
        422,
      );
    }

    return jsonResponse({
      confidence: Number.isFinite(result.confidence) ? result.confidence : undefined,
      found: true,
      region,
    });
  } catch (error) {
    console.error('AI frame detection failed:', error);
    return jsonResponse(
      {
        found: false,
        message: 'Unable to process AI frame detection.',
      },
      500,
    );
  }
}
