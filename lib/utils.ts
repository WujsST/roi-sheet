import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: unknown, options?: {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}): string {
  const num = Number(value ?? 0);

  if (!Number.isFinite(num)) return "0";

  return num.toLocaleString('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  })
}
