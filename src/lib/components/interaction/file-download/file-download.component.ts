import {Component, Input} from '@angular/core';
import {DropFile} from '../../../utility/drop-file';
import {saveAs} from 'file-saver';
import {FileDisplay} from '../../layout/file-display';
import {downloadZip} from 'client-zip';

@Component({
    selector: 'ilpn-file-download',
    templateUrl: './file-download.component.html',
    styleUrls: ['./file-download.component.scss']
})
export class FileDownloadComponent {

    @Input() descriptionText: string = '';
    @Input() squareContent: string = '?';
    @Input() showText = true;
    @Input() disabled = false;
    @Input() files: undefined | DropFile | Array<DropFile> = [];
    @Input() zipFileName = 'results';
    @Input() fileDisplay: FileDisplay | undefined;

    constructor() {
    }

    prevent(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    hoverStart(e: Event) {
        this.prevent(e);
        const target = (e.target as HTMLElement);
        target.classList.add('hover');
    }

    hoverEnd(e: MouseEvent, drop = false) {
        this.prevent(e);
        (e.target as HTMLElement).classList.remove('hover');
    }

    download() {
        if (this.disabled) {
            return;
        }
        if (this.files === undefined) {
            return;
        }
        if (Array.isArray(this.files) && this.files.length === 0) {
            return;
        }
        if (!Array.isArray(this.files) || this.files.length === 1) {
            // 1 file
            const file = Array.isArray(this.files) ? this.files[0] : this.files;
            saveAs(new Blob([file.content], {type: 'text/plain;charset=utf-8'}), file.name);
            return;
        }
        // multiple files
        downloadZip(this.files.map(f => ({name: f.name, input: f.content}))).blob().then(content => {
            saveAs(content, `${this.zipFileName}.zip`);
        });
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
