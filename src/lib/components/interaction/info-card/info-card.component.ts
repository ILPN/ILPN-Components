import {Component, Input} from '@angular/core';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-info-card',
    templateUrl: './info-card.component.html',
    styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent {

    @Input() squareContent: string | undefined;
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() disabled = false;
    @Input() descriptionLines = 3;

    resolveDescriptionHeight(): string {
        return `${this.descriptionLines}em`;
    }

}
