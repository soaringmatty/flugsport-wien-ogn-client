import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  imports: [],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent {
  label = input('');
  value = model(false);
  change = output<boolean>();

  toggle(): void {
    this.value.set(!this.value());
    this.change.emit(this.value());
  }
}
