import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Notification } from '../models/notification.model';
import { SwUpdate } from '@angular/service-worker';
import { interval, Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateService implements OnDestroy {
  private readonly checkForUpdateInterval = 1; // hours
  private readonly destroy$ = new Subject<void>();

  constructor(private updates: SwUpdate) {
    if (this.updates.isEnabled) {
      console.debug('Version update service initialized. Checking for update...');
      // Check for updates on startup
      this.updates.checkForUpdate();

      // Reload automatically when ne version is available
      this.updates.versionUpdates.pipe(takeUntil(this.destroy$)).subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          console.info('New client version available. Reloading...');
          location.reload();
        }
      });

      // Periodically check for updates
      interval(60 * 60 * 1000 * this.checkForUpdateInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updates.checkForUpdate());
    } else {
      console.warn('Client version updates not enabled');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
