/**
 * KASI API 프록시 서버리스 함수
 * Vercel/Netlify Functions 용
 *
 * 배포 방법:
 * 1. Vercel: vercel deploy
 * 2. Netlify: netlify deploy
 *
 * 환경 변수 설정 필요:
 * - KASI_API_KEY: 한국천문연구원 API 키
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 캐시 (메모리 기반 - 서버리스에서는 제한적)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1시간

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { type, year, month, day, lunYear, lunMonth, lunDay, leapMonth } = req.query;

  if (!type) {
    return res.status(400).json({
      error: 'Missing required parameter: type',
      usage: {
        solarToLunar: '/api/kasi?type=solarToLunar&year=2024&month=1&day=15',
        lunarToSolar: '/api/kasi?type=lunarToSolar&lunYear=2024&lunMonth=1&lunDay=5&leapMonth=0',
      },
    });
  }

  const apiKey = process.env.KASI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error: KASI_API_KEY not set',
    });
  }

  try {
    let apiUrl = '';
    let cacheKey = '';

    if (type === 'solarToLunar') {
      if (!year || !month || !day) {
        return res.status(400).json({
          error: 'Missing parameters for solarToLunar: year, month, day',
        });
      }

      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      cacheKey = `solar_${year}${formattedMonth}${formattedDay}`;

      apiUrl = `http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getSolCalInfo?serviceKey=${apiKey}&solYear=${year}&solMonth=${formattedMonth}&solDay=${formattedDay}`;
    } else if (type === 'lunarToSolar') {
      if (!lunYear || !lunMonth || !lunDay) {
        return res.status(400).json({
          error: 'Missing parameters for lunarToSolar: lunYear, lunMonth, lunDay',
        });
      }

      const formattedMonth = String(lunMonth).padStart(2, '0');
      const formattedDay = String(lunDay).padStart(2, '0');
      const isLeapMonth = leapMonth === '1' || leapMonth === 'true' ? 'leap' : '';
      cacheKey = `lunar_${lunYear}${formattedMonth}${formattedDay}${isLeapMonth}`;

      apiUrl = `http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?serviceKey=${apiKey}&lunYear=${lunYear}&lunMonth=${formattedMonth}&lunDay=${formattedDay}${isLeapMonth ? '&leapMonth=leap' : ''}`;
    } else {
      return res.status(400).json({
        error: 'Invalid type. Use "solarToLunar" or "lunarToSolar"',
      });
    }

    // 캐시 확인
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json({
        ...cached.data,
        cached: true,
      });
    }

    // API 호출
    const response = await fetch(apiUrl);
    const xmlText = await response.text();

    // XML 파싱 (간단한 방법)
    const parseXml = (xml: string) => {
      const getValue = (tag: string): string => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
        return match ? match[1] : '';
      };

      return {
        solYear: getValue('solYear'),
        solMonth: getValue('solMonth'),
        solDay: getValue('solDay'),
        solLeapyear: getValue('solLeapyear'),
        solWeek: getValue('solWeek'),
        lunYear: getValue('lunYear'),
        lunMonth: getValue('lunMonth'),
        lunDay: getValue('lunDay'),
        lunLeapmonth: getValue('lunLeapmonth'),
        lunSecha: getValue('lunSecha'),
        lunWolgeon: getValue('lunWolgeon'),
        lunIljin: getValue('lunIljin'),
      };
    };

    const result = parseXml(xmlText);

    // 캐시 저장
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('KASI API Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch data from KASI API',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
