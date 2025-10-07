import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-search-select',
  imports: [FormsModule],
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.scss'
})
export class SearchSelectComponent implements OnInit {
  @Input() searchFunction!: (term: string) => any[];
  @Input() placeholder: string = 'Выберите или найдите...';
  @Input() debounceTime: number = 100;
  @Input() hasError: boolean = false;

  @Output() optionSelected = new EventEmitter<any>();

  searchTerm = '';
  options: any[] = [];
  selectedOption: any = null;
  isOpen = false;

  focusedOptionIndex = -1;
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged()
    ).subscribe(term => {
      this.options = this.searchFunction(term);
    });
  }

  onInputChange() {
    this.searchSubject.next(this.searchTerm);
    this.isOpen = true;
  }

  onFocus() {
    this.options = this.searchFunction(this.searchTerm);
    this.isOpen = true;
  }

  onBlur() {
    this.isOpen = false;
    this.focusedOptionIndex = -1;
  }

  selectOption(option: any) {
    this.selectedOption = option;
    this.searchTerm = option.name;
    this.isOpen = false;
    this.optionSelected.emit(option);
  }

  clearOption() {
    this.selectedOption = null;
    this.searchTerm = '';
    this.isOpen = false;
    this.optionSelected.emit(null);
    this.focusedOptionIndex = -1;
  }


  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousOption();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.focusedOptionIndex >= 0) {
          this.selectOption(this.options[this.focusedOptionIndex]);
        }
        break;
      case 'Escape':
        this.isOpen = false;
        break;
    }
  }

  private focusNextOption() {
    this.focusedOptionIndex =
      this.focusedOptionIndex >= this.options.length - 1
        ? 0
        : this.focusedOptionIndex + 1;
    this.scrollToFocusedOption();
  }

  private focusPreviousOption() {
    this.focusedOptionIndex =
      this.focusedOptionIndex <= 0
        ? this.options.length - 1
        : this.focusedOptionIndex - 1;
    this.scrollToFocusedOption();
  }

  private scrollToFocusedOption() {
    setTimeout(() => {
      const focusedElement = document.querySelector('.dropdown-option.focused') as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    });
  }
}
