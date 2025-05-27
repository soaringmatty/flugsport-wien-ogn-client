import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MapSettings } from '../../models/settings.model';
import { OgnStore } from '../../store/ogn.store';
import config from '../../../../package.json';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly store = inject(OgnStore);

  readonly versionNumber = config.version;

  /** Signal mit einer kopierten Version der Settings */
  readonly settings = signal<MapSettings>({ ...this.store.settings() });

  /** Save-Methode speichert die Signal-Werte zurück im Store */
  save(): void {
    this.store.saveSettings(this.settings());
  }
}