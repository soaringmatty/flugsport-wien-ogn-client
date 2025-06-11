import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { OgnStore } from '../../store/ogn.store';

@Component({
  selector: 'app-barogram',
  imports: [],
  templateUrl: './barogram.component.html',
  styleUrl: './barogram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarogramComponent {
  private readonly store = inject(OgnStore);
  
  flightHistory = this.store.flightHistory;
}
