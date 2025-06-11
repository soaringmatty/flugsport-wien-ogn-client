import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailViewMobileComponent } from './detail-view-mobile.component';

describe('DetailViewMobileComponent', () => {
  let component: DetailViewMobileComponent;
  let fixture: ComponentFixture<DetailViewMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailViewMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailViewMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
