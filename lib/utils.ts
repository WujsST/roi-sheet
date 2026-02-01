import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, options?: {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}): string {
  return value.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  })
}
