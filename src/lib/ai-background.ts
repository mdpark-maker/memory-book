import Anthropic from '@anthropic-ai/sdk'
import type { BackgroundStyle } from '@/types'

export interface PhotoInfo {
  takenAt: string | null
  month?: number
}

function getSeasonalColors(month: number | null): BackgroundStyle {
  if (month === null) {
    return {
      type: 'gradient',
      colors: ['#faf8f5', '#f5f0eb'],
      angle: 135,
      mood: '추억',
    }
  }

  if (month >= 3 && month <= 5) {
    // Spring
    return {
      type: 'gradient',
      colors: ['#f8bbd0', '#c8e6c9', '#fff9c4'],
      angle: 135,
      mood: '봄날',
    }
  } else if (month >= 6 && month <= 8) {
    // Summer
    return {
      type: 'gradient',
      colors: ['#b3e5fc', '#e0f7fa', '#fff8e1'],
      angle: 160,
      mood: '여름추억',
    }
  } else if (month >= 9 && month <= 11) {
    // Autumn
    return {
      type: 'gradient',
      colors: ['#ffe0b2', '#ffccbc', '#fce4ec'],
      angle: 120,
      mood: '가을감성',
    }
  } else {
    // Winter (12, 1, 2)
    return {
      type: 'gradient',
      colors: ['#e8eaf6', '#e3f2fd', '#f3e5f5'],
      angle: 150,
      mood: '겨울감성',
    }
  }
}

function getMonthFromDateString(dateStr: string | null): number | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.getMonth() + 1 // 1-12
  } catch {
    return null
  }
}

function getDominantMonth(photos: PhotoInfo[]): number | null {
  const months: number[] = []
  for (const photo of photos) {
    const month = photo.month ?? getMonthFromDateString(photo.takenAt)
    if (month !== null) months.push(month)
  }
  if (months.length === 0) return null
  // Use median month
  months.sort((a, b) => a - b)
  return months[Math.floor(months.length / 2)]
}

function buildPrompt(pagePhotos: PhotoInfo[]): string {
  const dates = pagePhotos
    .map((p) => p.takenAt)
    .filter(Boolean)
    .map((d) => {
      try {
        return new Date(d!).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } catch {
        return d
      }
    })

  const dateList = dates.length > 0 ? dates.join(', ') : '날짜 없음'

  return `Analyze these photo dates and return a JSON object with fields:
- colors: array of 2-3 hex colors for a beautiful gradient background
- angle: gradient angle in degrees (0-360)
- mood: one-word mood description in Korean (e.g., "봄날", "여름추억", "가을감성")

Photo dates: ${dateList}
Make the colors soft, pastel, and photographic-quality. Return only valid JSON.`
}

export async function generateBackgroundsForPages(
  photoGroups: PhotoInfo[][]
): Promise<BackgroundStyle[]> {
  // Fall back immediately if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return photoGroups.map((group) => {
      const month = getDominantMonth(group)
      return getSeasonalColors(month)
    })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const results: BackgroundStyle[] = []

  for (const group of photoGroups) {
    const fallback = getSeasonalColors(getDominantMonth(group))

    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system:
          'You are a professional photobook designer. Return only valid JSON without markdown code fences.',
        messages: [
          {
            role: 'user',
            content: buildPrompt(group),
          },
        ],
      })

      const raw =
        message.content[0].type === 'text' ? message.content[0].text.trim() : ''

      // Strip possible markdown fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

      const parsed = JSON.parse(cleaned) as {
        colors?: string[]
        angle?: number
        mood?: string
      }

      const colors = Array.isArray(parsed.colors) && parsed.colors.length >= 2
        ? parsed.colors
        : fallback.colors

      results.push({
        type: 'gradient',
        colors,
        angle: typeof parsed.angle === 'number' ? parsed.angle : fallback.angle,
        mood: typeof parsed.mood === 'string' ? parsed.mood : fallback.mood,
      })
    } catch {
      results.push(fallback)
    }
  }

  return results
}
