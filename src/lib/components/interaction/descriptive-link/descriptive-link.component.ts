import {Component, Inject, Input} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-descriptive-link',
    templateUrl: './descriptive-link.component.html',
    styleUrls: ['./descriptive-link.component.scss']
})
export class DescriptiveLinkComponent {

    @Input() squareContent: string = '?';
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() disabled = false;
    @Input() descriptionLines = 3;

    @Input() link: Array<string> | string | undefined;
    @Input() download = false;
    @Input() router = false;

    constructor(@Inject(APP_BASE_HREF) public baseHref: string) {
    }

    type(): string {
        if (this.disabled) {
            return 'disabled';
        }
        if (this.isAnchor()) {
            return 'anchor';
        } else {
            return 'button';
        }

    }

    resolveAnchorLink(): string {
        return this.resolveSingleLink(this.link as string);
    }

    buttonClick() {
        if (this.link === undefined || this.isAnchor()) {
            return;
        }

        const links = (this.link as Array<string>).map(l => this.resolveSingleLink(l));

        for (const link of links) {
            this.createDownloadLink(link);
        }
    }

    private isAnchor(): boolean {
        return this.link !== undefined && !Array.isArray(this.link);
    }

    private resolveSingleLink(link: string) {
        if (link.startsWith('http')) {
            return link;
        }
        return this.baseHref + link;
    }

    private createDownloadLink(link: string) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = link;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

}
