import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PnDisplayComponent} from './pn-display.component';
import {ViewBoxPipe} from './internals/view-box.pipe';


describe('PnDisplayComponent', () => {
    let component: PnDisplayComponent;
    let fixture: ComponentFixture<PnDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PnDisplayComponent, ViewBoxPipe]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PnDisplayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
