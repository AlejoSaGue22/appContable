import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TesoreriaPageComponent } from './tesoreria-page.component';

describe('TesoreriaPageComponent', () => {
  let component: TesoreriaPageComponent;
  let fixture: ComponentFixture<TesoreriaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TesoreriaPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TesoreriaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
