import { TimeSlot, Activity, Cluster } from './../interfaces/db.interface';
import { db } from '../db';
import { Injectable } from '@angular/core';
import Dexie, { EntityTable, liveQuery } from 'dexie';
import { catchError, from, map, Observable, of } from 'rxjs';

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

    async addTimeSlot(slot: Omit<TimeSlot, 'id'>): Promise<number> {
        console.log('📝 Adding TimeSlot to DB:', slot);
        const newId = await db.timeSlots.add(slot)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }

        console.log('➡️ Added with ID:', newId);
        return newId
    }

    async stopTimeSlot(timeSlotId: number): Promise<void> {
        console.log('📝 Updating TimeSlot in DB:', timeSlotId);

        const updatedCount = await db.timeSlots.update(timeSlotId, {
            endTime: new Date()
        });

        console.log('✅ Updated records count:', updatedCount);

        if (updatedCount === 0) {
            console.error('❌ No record found with ID:', timeSlotId);
        }
    }

    getLastTimeSlot(): Observable<TimeSlot | null> {
        return from(db.timeSlots.orderBy('id').reverse().first()).pipe(
            map(timeSlot => timeSlot || null),
            catchError(error => of(null))
        );
    }

    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.wrapLiveQuery(
            () => db.timeSlots.toArray()
        )
    }

    getActivitiesByClusterId(clusterId: number): Observable<Activity[]> {
        return this.wrapLiveQuery(() =>
            db.activities
                .where('clusterId')
                .equals(clusterId)
                .and(activity => activity.isActive === 1)
                .toArray()
        );
    }
    getAllActiveClusters(): Observable<Cluster[]> {
        return this.wrapLiveQuery(() =>
            db.clusters.where('isActive').equals(1).toArray()
        );
    }

    // пытался реализовать обретку от дублировния кода ниже, но без any она работать ни в какую н езахотела
    // конфликт типов table EntityTable<T, 'id'> и Omit<T, 'id'>
    // моих знаний на как починить не хватило
    // private async addWithIdCheck(
    //     item: any, 
    //     table: any, 
    //     entityName: string
    // ): Promise<number> {
    //     const newId = await table.add(item);
    //     if (newId === undefined) {
    //         throw new Error(`Ошибка базы данных: не удалось добавить ${entityName}, ID не получен.`);
    //     }
    //     return newId;
    // }
    // return this.addWithIdCheck(activity, db.activities, 'активность')

    // метод принимает объект, где id ТОЧНО НЕ ДОЛЖНО быть
    async addActivity(activity: Omit<Activity, 'id'>): Promise<number> {
        const newId = await db.activities.add(activity)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }
        return newId
    }

    async addCluster(cluster: Omit<Cluster, 'id'>): Promise<number> {
        const newId = await db.clusters.add(cluster)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }
        return newId
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
        await db.activities.update(activityId, { isActive: 0 });
    }

    async activateActivity(activityId: number): Promise<void> {
        await db.activities.update(activityId, { isActive: 1 });
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

    async debugActivities() {
        const allActivities = await db.activities.toArray();
        console.log('Все активности в базе:', allActivities);
        return allActivities;
    }
}