import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${weekStart.toLocaleDateString("pt-BR", opts)} – ${weekEnd.toLocaleDateString("pt-BR", opts)}`;
}

export function getAllWeeks(startYear: number, count: number): Date[] {
  const weeks: Date[] = [];
  const now = new Date();
  const current = new Date(startYear, 0, 1);
  while (current <= now) {
    weeks.push(getWeekStart(current));
    current.setDate(current.getDate() + 7);
  }
  return weeks.slice(-count);
}
