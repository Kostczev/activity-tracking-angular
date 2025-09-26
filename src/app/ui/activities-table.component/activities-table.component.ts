import { Component, computed, inject, input } from '@angular/core';
import { StatisticSlot } from '../../core/interfaces/db.interface';
import { DataService } from '../../core/services/data.service';
import { DateFormatService } from '../../core/services/date-format.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-activities-table-component',
  imports: [DatePipe],
  templateUrl: './activities-table.component.html',
  styleUrl: './activities-table.component.scss'
})
export class ActivitiesTableComponent {
  statisticSlots = input.required<StatisticSlot[]>()
  slots = computed(() => this.statisticSlots())

  private dataService = inject(DataService)
  private dateFormatService = inject(DateFormatService)

  getClusterName = (clusterId: number) => this.dataService.getClusterName(clusterId)
  formatDuration = (duration: number) => this.dateFormatService.formatDuration(duration)
  getPercentageForDay = (duration: number) => this.dateFormatService.getPercentageForDay(duration)
}
