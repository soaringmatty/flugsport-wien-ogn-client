import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartureListFilterComponent } from './departure-list-filter.component';

describe('DepartureListFilterComponent', () => {
  let component: DepartureListFilterComponent;
  let fixture: ComponentFixture<DepartureListFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartureListFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartureListFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
