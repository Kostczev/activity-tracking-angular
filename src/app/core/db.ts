import { Dexie, EntityTable } from 'dexie';
import { Activity, Cluster, TimeSlot } from './interfaces/db.interface';


export class TimeTrackerDB extends Dexie {
  
  timeSlots!: EntityTable<TimeSlot, 'id'>;
  activities!: EntityTable<Activity, 'id'>;
  clusters!: EntityTable<Cluster, 'id'>;

  constructor() {
    // Вызываем конструктор родительского класса (Dexie) и передаем имя базы данных ('TimeTrackerDB').
    // Это имя будет видно в инструментах разработчика.
    super('TimeTrackerDB');
    
    // Определяем структуру БД
    // version(1) — это первая версия схемы
    // Если потом понадолбится новая таблица или поле, нужно будет увеличить версию (version(2)), и Dexie автоматически выполнит миграцию
    this.version(1).stores({
      // Описываем таблицы и их индексы.
      // Синтаксис: 'название_таблицы: ++первичный_ключ, поле1, ...'
      
      // '++id' - первичный ключ с автоинкрементом (каждый новый слот получит уникальный id)
      timeSlots: '++id, activityId, startTime, endTime',
      
      // 'id' - первичный ключ (без ++, т.к. мы будем задавать его сами, например, 'work')
      activities: '++id, name, clusterId, isActive',
      
      clusters: '++id, name, isActive'
    });
  }
}

// Создаем экземпляр нашей БД. Это СИНГЛТОН
// Создаем здесь и экспортируем, чтобы любой сервис или компонент мог импортировать и использовать его сразу
export const db = new TimeTrackerDB();


