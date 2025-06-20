import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { OgnStore } from '../../store/ogn.store';
import { ToggleComponent } from '../shared/toggle/toggle.component';
import { CommonModule } from '@angular/common';
import { DepartureListFilter } from '../../models/departure-list-filter.model';
import { LaunchType } from '../../models/launch-type';
import { defaultDepartureListFilter } from '../../services/settings.service';

@Component({
  selector: 'app-departure-list-filter',
  imports: [CommonModule, ToggleComponent],
  templateUrl: './departure-list-filter.component.html',
  styleUrl: './departure-list-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartureListFilterComponent {
  readonly store = inject(OgnStore);

  close = output();
  filter = signal(defaultDepartureListFilter);

  isApplyDisabled = computed(() => {
    const filter = this.filter();
    return !(
      filter.includeLaunchTypeWinch ||
      filter.includeLaunchTypeAerotow ||
      filter.includeLaunchTypeMotorized ||
      filter.includeLaunchTypeUnknown
    );
  });

  constructor() {
    this.filter.set({ ...this.store.departureListFilter() });
  }

  apply() {
    this.store.saveDepartureListFilter(this.filter());
    this.close.emit();
  }

  closeDialog() {
    this.store.loadDepartureListFilter();
    this.filter.set({ ...this.store.departureListFilter() });
    this.close.emit();
  }

  reset() {
    this.store.loadDepartureListFilter();
    this.filter.set(defaultDepartureListFilter);
  }

  toggleLaunchType(type: LaunchType) {
    const current = this.filter();
    const updated: Partial<DepartureListFilter> = {};
    switch (type) {
      case LaunchType.winch:
        updated.includeLaunchTypeWinch = !current.includeLaunchTypeWinch;
        break;
      case LaunchType.aerotow:
        updated.includeLaunchTypeAerotow = !current.includeLaunchTypeAerotow;
        break;
      case LaunchType.motorized:
        updated.includeLaunchTypeMotorized = !current.includeLaunchTypeMotorized;
        break;
      case LaunchType.unknown:
        updated.includeLaunchTypeUnknown = !current.includeLaunchTypeUnknown;
        break;
    }
    this.filter.set({ ...current, ...updated });
  }

  toggleKnownOnly() {
    this.filter.set({ ...this.filter(), knownGlidersOnly: !this.filter().knownGlidersOnly });
  }

  toggleUTC() {
    this.filter.set({ ...this.filter(), utcTimestamps: !this.filter().utcTimestamps });
  }

  updateFlarmId(value: string) {
    this.filter.set({ ...this.filter(), flarmId: value });
  }
}
