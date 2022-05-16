import {Component, Input} from '@angular/core';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-info-card',
    templateUrl: './info-card.component.html',
    styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent {

    @Input() squareContent: string = '?';
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() fileDisplay: FileDisplay | undefined;

    constructor() {
    }

    resolveSquareContent(): string {
        if (this.fileDisplay !== undefined) {
            return this.fileDisplay.icon;
        }
        return this.squareContent;
    }

    resolveSquareColor(): string {
        if (this.fileDisplay !== undefined) {
            return this.fileDisplay.color;
        }
        return 'black';
    }

}
