import { ChangeDetectionStrategy, Component, input, Input, signal } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  imports: [],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent {}

@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCheckboxComponent {
  label = input('');

  @Input({ required: true }) checked = signal(false);
  @Input() onChange: (event: Event) => void = () => {};

  onCheckedChange(event: Event) {
    this.onChange(event);
  }
}
