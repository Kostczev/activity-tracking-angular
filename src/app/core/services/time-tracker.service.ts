import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { Activity, TimeSlot } from '../interfaces/db.interface';
import { BehaviorSubject, filter, firstValueFrom, interval, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerService {
  private currentStartTime$ = new BehaviorSubject<Date | null>(null)
  currentActivityId$ = new BehaviorSubject<number | null>(null);
  currentActivityName$ = new BehaviorSubject<string | null>(null);

  currentDuration$ = this.currentStartTime$.pipe(
    switchMap(startTime =>
      startTime ?
        interval(1000).pipe(
          map(() => this.calculateDuration(startTime))
        ) :
        of('00:00:00')
    )
  );

  currentTimeSlotId: number | null = null

  constructor(private dataService: DataService) {
    this.loadCurrentActivity()
  }

  // Начать новую активность
  async startActivity(activity: Activity): Promise<void> {
    const startTime = new Date()
    const newSlot: Omit<TimeSlot, 'id'> = {
      activityId: activity.id!,
      startTime: startTime,
      endTime: null,
    };

    console.log('🟢 START Activity:', {
      activity,
      time: newSlot.startTime
    });

    this.currentActivityId$.next(activity.id!)
    this.currentActivityName$.next(activity.name)
    this.currentStartTime$.next(startTime)
    this.currentTimeSlotId = await this.dataService.addTimeSlot(newSlot)
  }

  // Остановить текущую активность
  async stopCurrentActivity(): Promise<void> {
    if (this.currentTimeSlotId === null) {
      // Пытаемся найти активный слот в БД
      const activeSlot = await firstValueFrom(
        this.dataService.getLastTimeSlot().pipe(
          filter(slot => slot?.endTime === null)
        )
      );
      if (activeSlot) {
        this.currentTimeSlotId = activeSlot.id!
        console.log('🔍 Found active time slot:', this.currentTimeSlotId)
      } else {
        console.warn('⚠️ No active time slot to stop')
        return
      }
    }
    await this.dataService.stopTimeSlot(this.currentTimeSlotId!)
    this.currentActivityId$.next(null)
    this.currentActivityName$.next(null)
    this.currentStartTime$.next(null)
    this.currentTimeSlotId = null
  }

  private async loadCurrentActivity() {
    try {
      console.log('🔄 Loading current activity from DB...');

      // 1. Получаем последний временной слот
      const lastSlot = await firstValueFrom(
        this.dataService.getLastTimeSlot().pipe(
          // Фильтруем только незавершенные слоты
          filter(slot => slot?.endTime === null)
        )
      );

      if (!lastSlot) {
        console.log('📭 No active time slot found');
        return;
      }

      console.log('📋 Found active time slot:', lastSlot);

      // 2. Получаем данные активности по ID из слота
      const activity = await firstValueFrom(
        this.dataService.getActivityById(lastSlot.activityId)
      );

      if (!activity) {
        console.error('❌ Activity not found for ID:', lastSlot.activityId);
        return;
      }

      console.log('👤 Found activity:', activity.name);

      // 3. Восстанавливаем состояние
      this.currentActivityId$.next(activity.id!)
      this.currentActivityName$.next(activity.name)
      this.currentStartTime$.next(lastSlot.startTime)
      this.currentTimeSlotId = lastSlot.id!;

      console.log('✅ Current activity restored:', activity.name);

    } catch (error) {
      console.error('❌ Error loading current activity:', error);
    }
  }

  private calculateDuration(startTime: Date): string {
    if (!startTime) return '00:00:00';

    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();

    return this.formatDuration(diffMs);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
