import { InitService } from './core/services/init.service';
import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CurrentTimer } from "./ui/current-timer/current-timer";
import { Header } from "./ui/header/header";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CurrentTimer, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('activity-tracking-angular');
  protected readonly isInitialized = signal(false);

  constructor(private initService: InitService) { } // Инжектим сервис

  async ngOnInit() {
    console.log('🟡 AppComponent: запуск инициализации');

    try {
      const initialized = await this.initService.initializeApp();
      if (initialized) {
        console.log('✅ Приложение инициализировано с стартовыми данными');
      } else {
        console.log('ℹ️ База уже была инициализирована ранее');
      }
    } catch (error) {
      console.error('❌ Ошибка инициализации приложения:', error);
    } finally {
      // ВЛЮЧАЕМ отображение приложения независимо от результата
      this.isInitialized.set(true);
      console.log('🚀 Приложение готово к работе');
    }
  }
}
