import { InitService } from './core/services/init.service';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentTimer } from "./common-ui/current-timer/current-timer";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CurrentTimer, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('activity-tracking-angular');

  constructor(private initService: InitService) {} // Инжектим сервис

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
    }
  }
}
