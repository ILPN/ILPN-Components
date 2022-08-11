import {Component, Input} from '@angular/core';
import {DropFile} from '../../../utility/drop-file';
import {saveAs} from 'file-saver';
import {downloadZip} from 'client-zip';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-file-download',
    templateUrl: './file-download.component.html',
    styleUrls: ['./file-download.component.scss']
})
export class FileDownloadComponent {

    @Input() descriptionText: string = '';
    @Input() squareContent: string | undefined;
    @Input() showText = true;
    @Input() disabled = false;
    @Input() files: undefined | DropFile | Array<DropFile> = [];
    @Input() zipFileName = 'results';
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() bold: boolean | undefined;

    isHovered = false;

    constructor() {
    }

    prevent(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    hoverStart(e: Event) {
        this.prevent(e);
        this.isHovered = true;
    }

    hoverEnd(e: MouseEvent, drop = false) {
        this.prevent(e);
        this.isHovered = false;
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

}
