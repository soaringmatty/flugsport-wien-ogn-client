import { Component, inject, Signal, computed, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexTooltip,
  ApexYAxis,
} from 'ng-apexcharts';
import { OgnStore } from '../../store/ogn.store';
import { CommonModule } from '@angular/common';
import { HistoryEntry } from '../../models/history-entry.model';
import { MapBarogramSyncService } from '../../services/map-barogram-sync.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  markers: ApexMarkers;
};

@Component({
  selector: 'app-barogram',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './barogram.component.html',
  styleUrl: './barogram.component.scss',
})
export class BarogramComponent implements OnInit, OnDestroy {
  //private subscription: Subscription | undefined;
  @ViewChild('chartRef') chartRef!: ChartComponent;
  private tooltipVisible = false;
  private tooltipPollInterval: any;

  private readonly store = inject(OgnStore);
  private readonly mapBarogramSyncService = inject(MapBarogramSyncService);
  flightHistory = this.store.flightHistory;

  chartOptions: Signal<ChartOptions> = computed(() => {
    return {
      series: [
        {
          name: 'Höhe (MSL)',
          data: this.flightHistory().map((entry) => ({
            x: entry.timestamp,
            y: entry.altitude,
            meta: entry,
          })),
        },
      ],
      chart: {
        type: 'line',
        height: 140,
        parentHeightOffset: 0,
        animations: { enabled: false },
        zoom: { enabled: false },
        toolbar: { show: false },
        events: {
          mouseLeave: () => {
            this.mapBarogramSyncService.markerLocationUpdateRequested.emit();
          },
        },
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#991b1b'], // dark red
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: 'datetime',
        tooltip: { enabled: false },
        labels: {
          datetimeUTC: false,
          datetimeFormatter: {
            hour: 'HH:mm',
            minute: 'HH:mm',
            second: 'HH:mm',
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `${Math.round(val)} m`,
        },
      },
      markers: {
        size: 0,
        colors: ['#991b1b'],
        hover: {
          size: 6,
          sizeOffset: 10,
        },
      },
      tooltip: {
        marker: {
          show: false,
        },
        custom: ({ dataPointIndex, w }) => {
          const entry: HistoryEntry = w.globals.initialSeries[0].data[dataPointIndex].meta;

          const data = w.globals.initialSeries[0].data;
          const current = data[dataPointIndex]?.meta;
          const prev = data[dataPointIndex - 1]?.meta;
          const next = data[dataPointIndex + 1]?.meta;
          const rotation = this.mapBarogramSyncService.calculateRotation(current, prev, next);
          this.tooltipVisible = true;
          this.mapBarogramSyncService.markerLocationUpdateRequested.emit({
            latitude: entry.latitude,
            longitude: entry.longitude,
            rotation,
          });

          return `
            <div class="p-2 text-xs">
              <strong>${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><br/>
              Höhe: ${entry.altitude} m<br/>
              Geschwindigkeit: ${entry.speed} km/h<br/>
              Vario: ${entry.verticalSpeed} m/s<br/>
            </div>
          `;
        },
      },
    };
  });

  startTooltipWatcher() {
    this.tooltipPollInterval = setInterval(() => {
      const tooltip = document.querySelector('.apexcharts-tooltip');
      const visible = tooltip && tooltip.classList.contains('apexcharts-active');

      if (!visible && this.tooltipVisible) {
        this.tooltipVisible = false;
        this.mapBarogramSyncService.markerLocationUpdateRequested.emit();
      }
    }, 50);
  }

  ngOnInit(): void {
    this.startTooltipWatcher();
  }

  ngOnDestroy(): void {
    clearInterval(this.tooltipPollInterval);
  }
}
