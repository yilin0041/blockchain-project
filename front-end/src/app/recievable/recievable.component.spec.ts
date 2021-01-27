import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecievableComponent } from './recievable.component';

describe('RecievableComponent', () => {
  let component: RecievableComponent;
  let fixture: ComponentFixture<RecievableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RecievableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecievableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
