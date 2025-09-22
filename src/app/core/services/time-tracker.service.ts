import { DataService } from './data.service';
import { Injectable } from '@angular/core';
import { Activity, TimeSlot } from '../interfaces/db.interface';
import { filter, firstValueFrom, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerService {
  currentTimeSlotId: number | null = null;

  constructor(private dataService: DataService) { }

  // Начать новую активность
  async startActivity(activityId: number): Promise<void> {
    const newSlot: Omit<TimeSlot, 'id'> = {
      activityId: activityId,
      startTime: new Date(),
      endTime: null,
    };

    console.log('🟢 START Activity:', {
      activityId,
      time: newSlot.startTime
    });

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
    this.currentTimeSlotId = null
  }

  loadCurrentActivity(): Observable<number | null> {
    return this.dataService.getLastTimeSlot().pipe(
      map(lastTimeSlot => {
        if (lastTimeSlot?.endTime === null) {
          return lastTimeSlot.activityId;
        }
        return null;
      })
    );
  }
}
