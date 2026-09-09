import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarPagoModalComponent } from './registrar-pago-modal.component';

describe('RegistrarPagoModalComponent', () => {
  let component: RegistrarPagoModalComponent;
  let fixture: ComponentFixture<RegistrarPagoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPagoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarPagoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
