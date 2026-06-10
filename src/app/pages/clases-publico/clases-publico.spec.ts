import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClasesPublicoComponent} from './clases-publico';

describe('ClasesPublico', () => {
  let component: ClasesPublicoComponent;
  let fixture: ComponentFixture<ClasesPublicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClasesPublicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClasesPublicoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
