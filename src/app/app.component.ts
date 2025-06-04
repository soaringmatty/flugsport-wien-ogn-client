import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationBarComponent } from "./components/navigation-bar/navigation-bar.component";
import { OgnStore } from './store/ogn.store';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, NavigationBarComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'flugsport-wien-ogn';
  readonly store = inject(OgnStore);

  ngOnInit(): void {
    this.store.loadSettings();
  }
}
