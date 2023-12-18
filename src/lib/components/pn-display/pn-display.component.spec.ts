import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PnDisplayComponent} from './pn-display.component';
import {ViewBoxPipe} from './internals/view-box.pipe';
import {PnDisplayModule} from "./pn-display.module";


describe('PnDisplayComponent', () => {
    let component: PnDisplayComponent;
    let fixture: ComponentFixture<PnDisplayComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PnDisplayComponent, ViewBoxPipe],
            imports: [PnDisplayModule]
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
