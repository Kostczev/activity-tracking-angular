import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-date-filter-component',
  imports: [],
  templateUrl: './date-filter.component.html',
  styleUrl: './date-filter.component.scss'
})

export class DateFilterComponent {
  quickFilters = [
    { id: 'today', label: 'Сегодня', daysBack: 0, period: 1 },
    { id: 'yesterday', label: 'Вчера', daysBack: 1, period: 1 },
    { id: 'week', label: 'Неделя', daysBack: 7, period: 7 },
    { id: 'month', label: 'Месяц', daysBack: 30, period: 30 }
  ];
  currentFilter = 'today';

  @Output() dateRangeChange = new EventEmitter<{ start: Date; end: Date; period: number }>();

  changePeriod(datePeriod: any) {
    this.currentFilter = datePeriod.id
    this.setDatePeriod(datePeriod.daysBack, datePeriod.period)
  }

  private setDatePeriod(daysBack: number, period: number): void {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    this.dateRangeChange.emit({
      start: startDate,
      end: endDate,
      period: period
    });
  }
}
