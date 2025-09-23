import { Component } from '@angular/core';
import { TimeTrackerService } from '../../core/services/time-tracker.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-current-timer',
  imports: [AsyncPipe],
  templateUrl: './current-timer.html',
  styleUrl: './current-timer.scss'
})
export class CurrentTimer {
  currentActivityName$: Observable<string | null>
  currentDuration$: Observable<string>;

  constructor(private timeTracker: TimeTrackerService) {
    this.currentActivityName$ = this.timeTracker.currentActivityName$
    this.currentDuration$ = this.timeTracker.currentDuration$
  }

  stopActivity() {
    this.timeTracker.stopCurrentActivity();
  }
}
