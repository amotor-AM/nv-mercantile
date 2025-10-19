import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize country input to ISO 3166-1 alpha-2 code (uppercase).
 * Accepts common names and abbreviations.
 */
export function normalizeCountryCode(input?: string): string | undefined {
  if (!input) return undefined
  const s = input.trim().toLowerCase()
  if (!s) return undefined
  const map: Record<string, string> = {
    "us": "US",
    "usa": "US",
    "united states": "US",
    "united states of america": "US",
    "america": "US",
    "ca": "CA",
    "canada": "CA",
    "gb": "GB",
    "uk": "GB",
    "united kingdom": "GB",
    "great britain": "GB",
    "au": "AU",
    "australia": "AU",
    "de": "DE",
    "germany": "DE",
    "fr": "FR",
    "france": "FR",
    "es": "ES",
    "spain": "ES",
    "it": "IT",
    "italy": "IT",
    "nl": "NL",
    "netherlands": "NL",
    "jp": "JP",
    "japan": "JP",
    "cn": "CN",
    "china": "CN",
    "in": "IN",
    "india": "IN",
  }
  if (map[s]) return map[s]
  // 2-letter code
  if (s.length === 2 && /^[a-z]{2}$/.test(s)) return s.toUpperCase()
  return undefined
}
