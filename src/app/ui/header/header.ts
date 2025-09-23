import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, fromEvent } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  private destroyRef = inject(DestroyRef);
  isMobile = signal(false)
  isMenuOpen = signal(false)

  constructor() {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.isMobile.set(window.innerWidth < 768);
      });

    this.isMobile.set(window.innerWidth < 768);
  }

  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenuOnMobile(): void {
    if (this.isMobile()) {
      this.isMenuOpen.set(false);
    }
  }
}
