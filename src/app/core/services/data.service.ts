import { TimeSlot, Activity, Cluster } from './../interfaces/db.interface';
import { db } from '../db';
import { Injectable } from '@angular/core';
import { liveQuery } from 'dexie';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {
    // Приватный метод-обертка для всех liveQuery
    private wrapLiveQuery<T>(queryFn: () => Promise<T[]>): Observable<T[]> {
        return new Observable<T[]>(subscriber => {
            const subscription = liveQuery(queryFn).subscribe({
                next: (data) => subscriber.next(data),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete()
            });
            return () => subscription.unsubscribe()
        });
    }

    async addTimeSlot(slot: Omit<TimeSlot, 'id'>): Promise<void> {
        await db.timeSlots.add(slot as TimeSlot);
    }

    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.wrapLiveQuery(
            () => db.timeSlots.toArray()
        )
    }

    // метод принимает объект, где id ТОЧНО НЕ ДОЛЖНО быть
    async addActivity(activity: Omit<Activity, 'id'>): Promise<number | undefined> {
        return await db.activities.add(activity);
    }

    async addCluster(cluster: Omit<Cluster, 'id'>): Promise<number | undefined> {
        return await db.clusters.add(cluster);
    }

    async updateActivity(activity: Activity): Promise<void> {
        if (activity.id === undefined) {
            throw new Error('Cannot update activity without ID');
        }
        await db.activities.update(activity.id, activity);
    }

    getAllClusters(): Observable<Cluster[]> {
        return this.wrapLiveQuery(
            () => db.clusters.toArray()
        );
    }

    async deactivateActivity(activityId: number): Promise<void> {
        await db.activities.update(activityId, { isActive: false });
    }

    async activateActivity(activityId: number): Promise<void> {
        await db.activities.update(activityId, { isActive: true });
    }

    async permanentlyDeleteActivity(activityId: number): Promise<{ success: boolean; message: string }> {
        // 1. Проверяем, есть ли связанные записи в timeSlots
        const relatedTimeSlots = await db.timeSlots.where('activityId').equals(activityId).count();
        if (relatedTimeSlots > 0) {
            // 2. Если есть, не удаляем, а возвращаем ошибку
            return {
                success: false,
                message: `Невозможно удалить. Существует ${relatedTimeSlots} записей времени, связанных с этой активностью. Сначала удалите их в истории.`
            };
        }
        // 3. Если связей нет — удаляем навсегда
        await db.activities.delete(activityId)
        return { success: true, message: 'Активность удалена.' }
    }

    getAllActivities(): Observable<Activity[]> {
        return this.wrapLiveQuery(() => db.activities.toArray())
    }

    getAllActiveActivities(): Observable<Activity[]> {
        return this.wrapLiveQuery(() =>
            db.activities.where('isActive').equals(1).toArray()
        )
    }
}