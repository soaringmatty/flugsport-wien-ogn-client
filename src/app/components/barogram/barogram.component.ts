import { ChangeDetectionStrategy, Component, inject, Signal, computed, effect, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexTooltip, ApexYAxis } from 'ng-apexcharts';
import { OgnStore } from '../../store/ogn.store';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

export interface HistoryEntry {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
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
            x: new Date(entry.timestamp).getTime(),
            y: entry.altitude,
            meta: entry
          })),
        },
      ],
      chart: {
        type: 'line',
        height: 144,
        // The following four properties are used to set correct chart size and position for mobile view
        width: 360,
        parentHeightOffset: 0,
        offsetX: -16,
        offsetY: -16,
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
      // markers: {
      //   size: 6, // Punkt in der Linie selbst (optional, wenn du durchgehende Linie willst)
      //   hover: {
      //     size: 10, // ← dieser Wert deaktiviert den Punkt beim Hover
      //     sizeOffset: 3
      //   }
      // },
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
            </div>
          `;
        }
      }
    }
  });

  constructor() {
    effect(() => {
      this.flightHistory();
      console.log((this.chartRef?.chartInstance() as any)?.w.config)
    })
  }

  // private chartOptions: ChartOptions = {
  //   series: [
  //     {
  //       name: 'Höhe (MSL)',
  //       data: [],
  //     },
  //   ],
  //   chart: {
  //     type: 'line',
  //     height: 120,
  //     animations: { enabled: false },
  //     zoom: { enabled: false },
  //     toolbar: { show: false }
  //   },
  //   stroke: {
  //     curve: 'smooth',
  //     width: 2,
  //     colors: ['#991b1b'] // dark red
  //   },
  //   dataLabels: {
  //     enabled: false
  //   },
  //   xaxis: {
  //     type: 'datetime',
  //     tooltip: {
  //       enabled: false // ← disables the label below the x axis!
  //     },
  //     labels: {
  //       datetimeFormatter: {
  //         hour: 'HH:mm',
  //         minute: 'HH:mm',
  //         second: 'HH:mm'
  //       }
  //     }
  //   },
  //   yaxis: {
  //     title: { text: 'Höhe (m)' },
  //     labels: {
  //       formatter: (val: number) => `${Math.round(val)} m`
  //     }
  //   },
  //   // markers: {
  //   //   size: 0, // Punkt in der Linie selbst (optional, wenn du durchgehende Linie willst)
  //   //   hover: {
  //   //     size: 0 // ← dieser Wert deaktiviert den Punkt beim Hover
  //   //   }
  //   // },
  //   tooltip: {
  //     marker: {
  //       show: false,
  //     },
  //     // marker: {
  //     //   show: false,
  //     //   fillColors: ['#991b1b']
  //     // },
  //     custom: ({ dataPointIndex, w }) => {
  //       const entry: HistoryEntry = w.globals.initialSeries[0].data[dataPointIndex].meta;
  //       return `
  //           <div class="p-2 text-sm">
  //             <strong>${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong><br/>
  //             Höhe: ${entry.altitude} m<br/>
  //           </div>
  //         `;
  //     }
  //   }
  // };

  // constructor() {
  //   effect(() => {
  //     this.updateSeries(this.flightHistory());
  //   })
  //   //this.updateSeries(this.flightHistory());
  // }

  // updateSeries(data: HistoryEntry[]): void {
  //   // const formattedData = data.map(entry => ({
  //   //   x: new Date(entry.timestamp).getTime(),
  //   //   y: entry.altitude,
  //   //   meta: entry
  //   // }));

  //   // this.chartRef?.updateSeries([{ name: 'Höhe', data: formattedData }], false);

  //   if (!this.chartRef) return;

  //   const formattedData = data.map(entry => ({
  //     x: new Date(entry.timestamp).getTime(),
  //     y: entry.altitude,
  //     meta: entry
  //   }));
  //   const shouldAppendData = formattedData.length === this.previousDataLength + 1;
  //   this.previousDataLength = formattedData.length;
  //   const chart = this.chartRef.chartInstance();

  //   if (shouldAppendData) {
  //     const newPoint = formattedData[formattedData.length - 1];
  //     chart.appendData([{data: newPoint}]);
  //   } else {
  //     // Falls z. B. die Länge stark abweicht oder beim ersten Laden
  //     chart.updateSeries([{ name: 'Höhe', data: formattedData }], false);
  //   }
  // }

  // ngOnDestroy(): void {
  //   this.subscription?.unsubscribe();
  // }
}
