import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { from, Observable, switchMap } from 'rxjs';
import { StatisticSlot, TimeSlot } from '../../core/interfaces/db.interface';
import { AsyncPipe } from '@angular/common';
import { DateFormatService } from '../../core/services/date-format.service';
import { ActivitiesTableComponent } from "../../ui/activities-table.component/activities-table.component";

@Component({
  selector: 'app-statistics',
  imports: [AsyncPipe, ActivitiesTableComponent],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class StatisticsComponent {
  // clusters$: Observable<Cluster[]>
  todayStats$: Observable<any[]>
  statisticSlots$: Observable<StatisticSlot[]>

  hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  constructor(
    private dataService: DataService,
    private dateFormatService: DateFormatService
  ) {
    this.statisticSlots$ = this.dataService.getStatistic(new Date(), new Date())
    this.todayStats$ = this.statisticSlots$.pipe(
      switchMap(slots => from(this.calculateStats(slots)))
    )
  }

  getTimelinePosition(startTime: Date): number {
    const start = new Date(startTime);
    const dayStart = new Date(start);
    dayStart.setHours(6, 0, 0, 0); // Начинаем день с 6 утра

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 0, 0, 0); // Заканчиваем в 23:00

    const totalDayMs = dayEnd.getTime() - dayStart.getTime();
    const positionMs = start.getTime() - dayStart.getTime();

    return (positionMs / totalDayMs) * 100;
  }
  getTimeDetails(slot: StatisticSlot): string {
    const start = new Date(slot.startTime);
    const end = slot.endTime ? new Date(slot.endTime) : new Date();
    const duration = slot.duration || 0;

    return `С ${start.getHours()}:${this.padZero(start.getMinutes())} • ${this.formatDuration(duration)}`;
  }
  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private async calculateStats(slots: StatisticSlot[]): Promise<any[]> {
    const groups = new Map();

    for (const slot of slots) {

      const activityName = slot.activityName

      if (!groups.has(activityName)) {
        groups.set(activityName, { activityName, duration: 0 });
      }
      groups.get(activityName).duration += slot.duration;
    }

    return Array.from(groups.values())
      // Сортируем по убыванию времени
      .sort((a, b) => b.duration - a.duration)
      // Форматируем для отображения
      .map(stat => ({
        activityName: stat.activityName,
        duration: this.dateFormatService.formatDuration(stat.duration),
        durationMs: stat.duration
      }));
  }

  formatDuration = (duration: number) => this.dateFormatService.formatDuration(duration)

  getPercentageForDay = (duration: number) => this.dateFormatService.getPercentageForDay(duration)

}
