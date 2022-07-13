import {Component, Input} from '@angular/core';
import {DropFile} from '../../../utility/drop-file';
import {saveAs} from 'file-saver';
import * as JSZip from 'jszip';
import {FileDisplay} from '../../layout/file-display';

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
    @Input() dontZip = false;

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
        if (this.dontZip) {
            for (const file of this.files) {
                saveAs(new Blob([file.content], {type: 'text/plain;charset=utf-8'}), file.name);
            }
        }else {
            // multiple files
            // TODO JSZip throws error when used like this in a library
            const zip = new JSZip();
            for (const file of this.files) {
                zip.file(file.name, file.content);
            }
            zip.generateAsync({type: 'blob'}).then(content => {
                saveAs(content, `${this.zipFileName}.zip`);
            });
        }
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
