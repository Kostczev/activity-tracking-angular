import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  formatDurationInMinutes(ms: number): string {
    const minutes = ms / (1000 * 60);
    return Math.abs(minutes % 1) < 0.1 ? minutes.toFixed(0) : minutes.toFixed(1);
  }

  getPercentageForDays(durationMs: number, countDays: number): number {
    const totalDayTime = countDays * 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    const percentage = (durationMs / totalDayTime) * 100;
    return +percentage.toFixed(2);
  }

  getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
