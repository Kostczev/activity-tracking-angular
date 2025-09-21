import { db } from '../db';
import { DataService } from './data.service';
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class InitService {
    constructor(private dataService: DataService) { }

    async initializApp(): Promise<boolean> {
        const hasData = await this.checkDbHasData()

        if (hasData) return false

        await this.createDefaultData()
        return true
    }

    private async checkDbHasData(): Promise<boolean> {
        const clustersCount = await db.clusters.count()
        return clustersCount > 0
    }

    private async createDefaultData(): Promise<void> {
        // Создаем кластеры и сразу получаем их ID
        const workId = await this.dataService.addCluster({ name: 'Работа', isActive: true });
        const restId = await this.dataService.addCluster({ name: 'Отдых', isActive: true });
        const physicalId = await this.dataService.addCluster({ name: 'ФизАктивность', isActive: true });
        const healthId = await this.dataService.addCluster({ name: 'Здоровье', isActive: true });
        const learnId = await this.dataService.addCluster({ name: 'Обучение', isActive: true });
        const lifeId = await this.dataService.addCluster({ name: 'Быт', isActive: true });

        // Массив активностей для массового добавления
        const activitiesToAdd = [
            // Работа
            { name: 'Планирование', clusterId: workId, isActive: true },
            { name: 'Совещание', clusterId: workId, isActive: true },
            { name: 'Кодинг', clusterId: workId, isActive: true },
            { name: 'Дизайн', clusterId: workId, isActive: true },

            // Отдых
            { name: 'Сон', clusterId: restId, isActive: true },
            { name: 'Просмотр контента', clusterId: restId, isActive: true },
            { name: 'Соцсети', clusterId: restId, isActive: true },
            { name: 'Ничегонеделание', clusterId: restId, isActive: true },

            // ФизАктивность
            { name: 'Зарядка', clusterId: physicalId, isActive: true },
            { name: 'Тренировка', clusterId: physicalId, isActive: true },
            { name: 'Прогулка', clusterId: physicalId, isActive: true },

            // Здоровье
            { name: 'Стоматолог', clusterId: healthId, isActive: true },
            { name: 'Аптека', clusterId: healthId, isActive: true },

            // Обучение
            { name: 'Чтение', clusterId: learnId, isActive: true },
            { name: 'Курсы', clusterId: learnId, isActive: true },
            { name: 'Английский', clusterId: learnId, isActive: true },
            { name: 'Пет-проект', clusterId: learnId, isActive: true },

            // Быт
            { name: 'Покупки', clusterId: lifeId, isActive: true },
            { name: 'Уборка', clusterId: lifeId, isActive: true },
            { name: 'Стирка', clusterId: lifeId, isActive: true },
            { name: 'Готовка', clusterId: lifeId, isActive: true },
        ];

        // Добавляем все активности в базу
        for (const activity of activitiesToAdd) {
            await this.dataService.addActivity(activity)
        }
    }
}