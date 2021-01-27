import { fakeAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { PayableComponent } from './payable.component';

describe('PayableComponent', () => {
  let component: PayableComponent;
  let fixture: ComponentFixture<PayableComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PayableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
