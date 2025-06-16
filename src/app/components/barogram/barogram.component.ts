import { ChangeDetectionStrategy, Component, inject, Signal, computed, effect, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexTooltip, ApexYAxis } from 'ng-apexcharts';
import { OgnStore } from '../../store/ogn.store';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HistoryEntry } from '../../models/history-entry.model';

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
  styleUrl: './barogram.component.scss'
})
export class BarogramComponent {
  //private subscription: Subscription | undefined;
  @ViewChild('chartRef') chartRef!: ChartComponent;
  private previousDataLength = 0;
  private lastHoveredIndex = 0;

  private readonly store = inject(OgnStore);
  flightHistory = this.store.flightHistory;

  chartOptions: Signal<ChartOptions> = computed(() => {
    return {
      series: [
        {
          name: 'Höhe (MSL)',
          data: this.flightHistory().map(entry => ({
            x: entry.timestamp,
            y: entry.altitude,
            meta: entry
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
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        colors: ['#991b1b'] // dark red
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'datetime',
        tooltip: { enabled: false },
        labels: {
          datetimeUTC: false,
          datetimeFormatter: {
            hour: 'HH:mm',
            minute: 'HH:mm',
            second: 'HH:mm'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `${Math.round(val)} m`
        }
      },
      markers: {
        size: 0,
        colors: ['#991b1b'],
        hover: {
          size: 6,
          sizeOffset: 10
        }
      },
      tooltip: {
        marker: {
          show: false,
        },
        custom: ({ dataPointIndex, w }) => {
          const entry: HistoryEntry = w.globals.initialSeries[0].data[dataPointIndex].meta;
          return `
            <div class="p-2 text-xs">
              <strong>${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><br/>
              Höhe: ${entry.altitude} m<br/>
              Geschwindigkeit: ${entry.speed} km/h<br/>
              Vario: ${entry.verticalSpeed} m/s<br/>
            </div>
          `;
        }
      }
    }
  });
}
