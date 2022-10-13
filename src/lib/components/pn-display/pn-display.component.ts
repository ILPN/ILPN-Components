import {Component, ElementRef, ViewChild} from '@angular/core';

@Component({
    selector: 'ilpn-pn-display',
    templateUrl: './pn-display.component.html',
    styleUrls: ['./pn-display.component.scss']
})
export class PnDisplayComponent {

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;

    constructor() {
    }

    processMouseDown(event: MouseEvent) {

    }

    shareMouseUp(event: MouseEvent) {

    }

    shareMouseMoved(event: MouseEvent) {

    }

    shareMouseExited(event: MouseEvent) {

    }

}
