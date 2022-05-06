import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {FileReaderService} from '../../../utility/file-reader.service';
import {take} from 'rxjs';
import {DropFile} from '../../../utility/drop-file';

@Component({
    selector: 'ilpn-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnDestroy {

    @Output('fileContent') fileContentEmitter: EventEmitter<Array<DropFile>>;

    @Input() descriptionText: string = '';
    @Input() squareContent: string = '?';
    @Input() showText = true;

    constructor(private _fileReader: FileReaderService) {
        this.fileContentEmitter = new EventEmitter<Array<DropFile>>();
    }

    ngOnDestroy(): void {
        this.fileContentEmitter.complete();
    }

    prevent(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    hoverStart(e: Event) {
        this.prevent(e);
        const target = (e.target as HTMLElement);
        target.classList.add('file-hover');
    }

    hoverEnd(e: MouseEvent, drop = false) {
        this.prevent(e);
        let div;
        if ((e.relatedTarget as HTMLElement)?.localName === 'mat-icon' || (e.target as HTMLElement)?.localName === 'mat-icon') {
            if (!drop) {
                return;
            }
            div = (e.target as HTMLElement).parentElement;
        } else {
            div = e.target;
        }
        (div as HTMLElement).classList.remove('file-hover');
    }

    fileDrop(e: DragEvent) {
        this.hoverEnd(e, true);
        this._fileReader.processFileUpload(e.dataTransfer?.files).pipe(take(1)).subscribe(result => {
            if (result.length > 0) {
                this.fileContentEmitter.emit(result);
            }
        });
    }
}
