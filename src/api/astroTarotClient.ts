import { datingApi } from './datingClient';

export interface DailyReadingRequest {
  birthDate: string;
  relationshipIntention?: string | null;
  date: string;
  language: 'vi';
  variationSeed: number;
}

export interface DailyReading {
  date: string;
  zodiac: {
    name: string;
    element: string;
    summary: string;
    energyScore: number;
  };
  tarot: {
    name: string;
    orientation: 'upright' | 'reversed' | string;
    meaning: string;
    message: string;
    imageKey?: string;
  };
  reading: {
    overview: string;
    love: string;
    connectionAdvice: string;
    emotion: string;
  };
  reflectionQuestion: string;
  disclaimer: string;
}

const ZODIAC_STARTS = [
  [120, 'Bảo Bình'],
  [219, 'Song Ngư'],
  [321, 'Bạch Dương'],
  [420, 'Kim Ngưu'],
  [521, 'Song Tử'],
  [621, 'Cự Giải'],
  [723, 'Sư Tử'],
  [823, 'Xử Nữ'],
  [923, 'Thiên Bình'],
  [1023, 'Bọ Cạp'],
  [1122, 'Nhân Mã'],
  [1222, 'Ma Kết'],
] as const;

export function getZodiacName(birthDate: string): string | null {
  // Chấp nhận yyyy-mm-dd hoặc yyyy/mm/dd (có thể kèm giờ phía sau)
  const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(birthDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Kiểm tra ngày có thật (loại 2000-02-30, tháng 13...)
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;

  const value = month * 100 + day;
  for (let i = ZODIAC_STARTS.length - 1; i >= 0; i--) {
    if (value >= ZODIAC_STARTS[i][0]) return ZODIAC_STARTS[i][1];
  }
  return 'Ma Kết'; // 1/1 – 19/1
}

function getElement(zodiac: string): string {
  if (['Bạch Dương', 'Sư Tử', 'Nhân Mã'].includes(zodiac)) return 'Lửa';
  if (['Kim Ngưu', 'Xử Nữ', 'Ma Kết'].includes(zodiac)) return 'Đất';
  if (['Song Tử', 'Thiên Bình', 'Bảo Bình'].includes(zodiac)) return 'Khí';
  return 'Nước';
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

function isDailyReading(value: unknown): value is DailyReading {
  if (!value || typeof value !== 'object') return false;
  const reading = value as Partial<DailyReading>;
  return Boolean(
    typeof reading.date === 'string' &&
    reading.zodiac &&
    typeof reading.zodiac.name === 'string' &&
    typeof reading.zodiac.element === 'string' &&
    typeof reading.zodiac.summary === 'string' &&
    typeof reading.zodiac.energyScore === 'number' &&
    reading.tarot &&
    typeof reading.tarot.name === 'string' &&
    typeof reading.tarot.orientation === 'string' &&
    typeof reading.tarot.meaning === 'string' &&
    typeof reading.tarot.message === 'string' &&
    reading.reading &&
    typeof reading.reading.overview === 'string' &&
    typeof reading.reading.love === 'string' &&
    typeof reading.reading.connectionAdvice === 'string' &&
    typeof reading.reading.emotion === 'string' &&
    typeof reading.reflectionQuestion === 'string' &&
    typeof reading.disclaimer === 'string'
  );
}

function getAiMessage(response: unknown): unknown {
  if (typeof response === 'string') return response;
  if (!response || typeof response !== 'object') return response;

  const body = response as {
    data?: unknown;
    message?: unknown;
    result?: unknown;
    response?: unknown;
    content?: unknown;
  };
  if (body.data !== undefined) {
    const data = body.data;
    if (typeof data === 'object' && data !== null) {
      const nested = data as {
        message?: unknown;
        response?: unknown;
        content?: unknown;
        result?: unknown;
      };
      return nested.message ?? nested.response ?? nested.content ?? nested.result ?? data;
    }
    return data;
  }
  return body.result ?? body.response ?? body.content ?? body.message;
}

export async function fetchDailyReading(
  payload: DailyReadingRequest,
): Promise<DailyReading> {
  const zodiac = getZodiacName(payload.birthDate);
  const element = getElement(zodiac);
  const prompt = [
    'Bạn là chuyên gia nội dung chiêm tinh và Tarot bằng tiếng Việt.',
    'Nội dung chỉ để giải trí và tự suy ngẫm, không khẳng định tương lai.',
    'Chỉ trả về một JSON object hợp lệ, không markdown, không giải thích bên ngoài JSON.',
    `Cung hoàng đạo đã được hệ thống xác định là "${zodiac}", nguyên tố "${element}". Không được thay đổi hai giá trị này.`,
    `Ngày xem: ${payload.date}.`,
    `Ngày sinh: ${payload.birthDate}.`,
    `Mục tiêu hẹn hò: ${payload.relationshipIntention || 'Chưa xác định'}.`,
    `Mã biến thiên: ${payload.variationSeed}. Dùng mã này để chọn lá Tarot và góc diễn giải khác biệt, tránh lặp lại nội dung cố định.`,
    'Hãy tạo tổng quan, tình yêu, kết nối, cảm xúc, một lá Tarot, lời khuyên và một câu hỏi suy ngẫm.',
    'Giọng văn ấm áp, cụ thể, tích cực vừa phải; không đề cập bệnh tật, cái chết hay đầu tư.',
    `Trả về đúng schema JSON này: ${JSON.stringify({
      date: payload.date,
      zodiac: { name: zodiac, element, summary: 'string', energyScore: 0 },
      tarot: {
        name: 'string',
        orientation: 'upright',
        meaning: 'string',
        message: 'string',
        imageKey: 'string',
      },
      reading: {
        overview: 'string',
        love: 'string',
        connectionAdvice: 'string',
        emotion: 'string',
      },
      reflectionQuestion: 'string',
      disclaimer: 'string',
    })}`,
  ].join('\n');

  const response = await datingApi.aiChat(prompt);
  const generated = getAiMessage(response);
  let result = generated;
  if (typeof generated === 'string') {
    try {
      result = parseJsonResponse(generated);
    } catch {
      throw new Error('Backend AI không trả về JSON lượt xem hợp lệ');
    }
  }

  if (!isDailyReading(result)) {
    throw new Error('Backend AI trả về thiếu trường dữ liệu lượt xem');
  }

  return {
    ...result,
    date: payload.date,
    zodiac: {
      ...result.zodiac,
      name: zodiac,
      element,
      energyScore: Math.min(100, Math.max(0, Math.round(result.zodiac.energyScore))),
    },
  };
}
