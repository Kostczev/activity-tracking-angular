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

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(this.debounceTime),
      distinctUntilChanged()
    ).subscribe(term => {
      // ВОТ ТУТ ВЫЗЫВАЕМ ФУНКЦИЮ ПОИСКА!
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
    // Небольшая задержка чтобы успеть обработать клик по option
    setTimeout(() => {
      this.isOpen = false;
    }, 10);
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
  }
}
