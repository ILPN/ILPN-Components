import {Component, Inject, Input} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-descriptive-link',
    templateUrl: './descriptive-link.component.html',
    styleUrls: ['./descriptive-link.component.scss']
})
export class DescriptiveLinkComponent {

    public static readonly DRAG_DATA_KEY = 'ilpn-descriptive-link';

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

        const links = this.resolveLinks();

        for (const link of links) {
            this.createDownloadLink(link);
        }
    }

    addDragInformation(e: DragEvent) {
        if (this.isAnchor()) {
            this.configureDragTransfer(e, this.resolveSingleLink(this.link as string));
            return;
        }
        const links = this.resolveLinks();
        if (links.length === 0) {
            e.preventDefault();
            return;
        }
        this.configureDragTransfer(e, JSON.stringify(links));
    }

    private configureDragTransfer(e: DragEvent, data: string) {
        e.dataTransfer!.effectAllowed = 'link';
        e.dataTransfer!.setData(DescriptiveLinkComponent.DRAG_DATA_KEY, data);
    }

    private isAnchor(): boolean {
        return this.link !== undefined && !Array.isArray(this.link);
    }

    private resolveLinks() {
        if (!Array.isArray(this.link)) {
            return [];
        }
        return this.link.map(l => this.resolveSingleLink(l));
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
