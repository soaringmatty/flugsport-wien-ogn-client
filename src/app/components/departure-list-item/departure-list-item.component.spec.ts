import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartureListItemComponent } from './departure-list-item.component';

describe('DepartureListItemComponent', () => {
  let component: DepartureListItemComponent;
  let fixture: ComponentFixture<DepartureListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartureListItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartureListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
