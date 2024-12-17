import {Component, Input} from '@angular/core';

@Component({
    selector: 'ilpn-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

    @Input()
    public sourceLink?: string;

}
