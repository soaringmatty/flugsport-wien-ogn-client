import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightInfoSheetComponent } from './flight-info-sheet.component';

describe('FlightInfoSheetComponent', () => {
  let component: FlightInfoSheetComponent;
  let fixture: ComponentFixture<FlightInfoSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightInfoSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightInfoSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
