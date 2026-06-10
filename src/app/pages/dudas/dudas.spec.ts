import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedoresRegistro } from './proveedores-registro';

describe('ProveedoresRegistro', () => {
  let component: ProveedoresRegistro;
  let fixture: ComponentFixture<ProveedoresRegistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedoresRegistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedoresRegistro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
