import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { BehaviorSubject, from, Observable, switchMap } from 'rxjs';
import { StatisticSlot, TimeSlot } from '../../core/interfaces/db.interface';
import { AsyncPipe } from '@angular/common';
import { DateFormatService } from '../../core/services/date-format.service';
import { ActivitiesTableComponent } from "../../ui/activities-table.component/activities-table.component";
import { DateFilterComponent } from "../../ui/date-filter.component/date-filter.component";

@Component({
  selector: 'app-statistics',
  imports: [AsyncPipe, ActivitiesTableComponent, DateFilterComponent],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class StatisticsComponent {
  todayStats$: Observable<any[]>
  statisticSlots$: Observable<StatisticSlot[]>
  private dateRange$ = new BehaviorSubject<{ start: Date; end: Date; period: number }>({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999)),
    period: 1
  });
  private period = 1;
  onDateRangeChange(range: { start: Date; end: Date; period: number }): void {
    this.dateRange$.next(range);
  }


  constructor(
    private dataService: DataService,
    private dateFormatService: DateFormatService
  ) {
    this.statisticSlots$ = this.dateRange$.pipe(
      switchMap(range => this.dataService.getStatistic(range.start, range.end))
    )
    this.todayStats$ = this.statisticSlots$.pipe(
      switchMap(slots => from(this.calculateStats(slots)))
    )
    this.dateRange$.subscribe(range => {
      this.period = range.period
    })
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

  getPercentageForDays = (duration: number) => this.dateFormatService.getPercentageForDays(duration, this.period)
}
