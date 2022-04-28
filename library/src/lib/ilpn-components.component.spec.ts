import {ComponentFixture, TestBed} from '@angular/core/testing';
import {IlpnComponentsComponent} from './ilpn-components.component';

describe('IlpnComponentsComponent', () => {
    let component: IlpnComponentsComponent;
    let fixture: ComponentFixture<IlpnComponentsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [IlpnComponentsComponent]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(IlpnComponentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
