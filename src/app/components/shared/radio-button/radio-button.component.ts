import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-radio-button',
  imports: [NgClass],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadioButtonComponent {
  label = input('');
  group = input('');
  value = input(false);
  change = output<void>();

  toggle(): void {
    this.change.emit();
  }
}
