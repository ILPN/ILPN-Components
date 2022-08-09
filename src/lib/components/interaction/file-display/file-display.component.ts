import {Component, Input} from '@angular/core';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-file-display',
    templateUrl: './file-display.component.html',
    styleUrls: ['./file-display.component.scss']
})
export class FileDisplayComponent {

    constructor() {
    }

    @Input() bold: boolean | undefined = false;
    @Input() squareContent: string | undefined;
    @Input() fileDisplay: FileDisplay | undefined;

    resolveSquareContent(): string {
        if (this.fileDisplay !== undefined) {
            return this.fileDisplay.icon;
        }
        return this.squareContent ?? '?';
    }

    resolveSquareColor(): string {
        if (this.fileDisplay !== undefined) {
            return this.fileDisplay.color;
        }
        return 'black';
    }

    resolveFontWeight(): string {
        let isBold;
        if (this.fileDisplay !== undefined) {
            isBold = this.fileDisplay.bold;

        } else {
            isBold = this.bold;
        }
        return isBold ? 'bold' : 'normal';
    }
}
