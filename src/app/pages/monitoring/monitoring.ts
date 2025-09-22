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
export class MonitoringComponent implements OnInit, OnDestroy {
  activities$?: Observable<Activity[]>
  currentActivity$: Observable<number | null> = of(null)
  currentActivityId: number | null = null
  currentTimeSlotId: number | null = null
  private subscription?: Subscription;

  clustersWithActivities = signal<{ cluster: Cluster; activities: Activity[] }[]>([]);

  constructor(
    private dataService: DataService,
    private timeTracker: TimeTrackerService
  ) {
    this.activities$ = this.dataService.getAllActiveActivities()
    this.currentActivity$ = this.timeTracker.loadCurrentActivity()
  }

  ngOnInit(): void {
    this.dataService.debugActivities()
    this.loadActivitiesByClusters()

    this.subscription = this.currentActivity$.subscribe(activityId => {
      this.currentActivityId = activityId;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async loadActivitiesByClusters() {
    const clusters = await firstValueFrom(this.dataService.getAllActiveClusters());

    const result = await Promise.all(
      clusters.map(async (cluster) => {
        const activities = await firstValueFrom(
          this.dataService.getActivitiesByClusterId(cluster.id!)
        );
        console.log(cluster, activities)
        return { cluster, activities };
      })
    );

    this.clustersWithActivities.set(result);
  }



  async onActivityClick(activityId: number) {
    // Сохраняем предыдущее значение
    const previousActivityId = this.currentActivityId;
    // обновляем состояние для UI
    this.currentActivityId = activityId;

    // Если нажали на уже активную кнопку - завершаем
    if (previousActivityId && previousActivityId === activityId) {
      this.currentActivityId = null;
      await this.timeTracker.stopCurrentActivity();
      return;
    }

    // Если есть другая активная активность - останавливаем её
    if (previousActivityId) {
      await this.timeTracker.stopCurrentActivity();
    }

    // Запускаем новую выбранную активность
    await this.timeTracker.startActivity(activityId);
  }

  isActive(activityId: number): boolean {
    return this.currentActivityId === activityId;
  }

  trackByActivityId(index: number, activity: Activity): number {
    return activity.id!;
  }
}
