import { DataService } from './../../core/services/data.service';
import { Activity, Cluster } from './../../core/interfaces/db.interface';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { firstValueFrom, Observable, of, Subscription } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TimeTrackerService } from '../../core/services/time-tracker.service';

@Component({
  selector: 'app-monitoring',
  imports: [AsyncPipe],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.scss'
})
export class MonitoringComponent implements OnInit {
  activities$?: Observable<Activity[]>
  currentActivityId$: Observable<number | null>

  clustersWithActivities = signal<{ cluster: Cluster; activities: Activity[] }[]>([]);

  constructor(
    private dataService: DataService,
    private timeTracker: TimeTrackerService
  ) {
    this.activities$ = this.dataService.getAllActiveActivities()
    this.currentActivityId$ = this.timeTracker.currentActivityId$
  }

  ngOnInit(): void {
    this.loadActivitiesByClusters()
  }

  async loadActivitiesByClusters() {
    const clusters = await firstValueFrom(this.dataService.getAllActiveClusters());

    const result = await Promise.all(
      clusters.map(async (cluster) => {
        const activities = await firstValueFrom(
          this.dataService.getActivitiesByClusterId(cluster.id!)
        );
        return { cluster, activities };
      })
    );

    this.clustersWithActivities.set(result);
  }



  async onActivityClick(activity: Activity) {
    const currentActivityId = await firstValueFrom(this.currentActivityId$);

    // смотрим был ли клик по активной
    if (currentActivityId === activity.id) {
      await this.timeTracker.stopCurrentActivity();
    } else {
      // если уже что-то включено - выключаем
      if (currentActivityId) {
        await this.timeTracker.stopCurrentActivity();
      }
      // Запускаем новую
      await this.timeTracker.startActivity(activity);
    }
  }

  trackByActivityId(index: number, activity: Activity): number {
    return activity.id!;
  }
}
