import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateAppPage } from './update-app.page';

describe('UpdateAppPage', () => {
  let component: UpdateAppPage;
  let fixture: ComponentFixture<UpdateAppPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateAppPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
