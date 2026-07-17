import { clsx, type ClassValue } from 'clsx'

// Tiny class combiner. (No tailwind-merge yet — add if conflicts arise.)
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
