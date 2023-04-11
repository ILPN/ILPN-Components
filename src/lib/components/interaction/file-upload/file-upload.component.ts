import {Component, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {FileReaderService} from '../../../utility/file-reader.service';
import {Subscription, take} from 'rxjs';
import {DropFile} from '../../../utility/drop-file';
import {FileDisplay} from '../../layout/file-display';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'ilpn-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnDestroy {

    @Output('fileContent') fileContentEmitter: EventEmitter<Array<DropFile>>;

    @Input() descriptionText: string = '';
    @Input() squareContent: string | undefined;
    @Input() showText = true;
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() bold: boolean | undefined;

    isHovered = false;

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
        this.isHovered = true;
    }

    hoverEnd(e: MouseEvent) {
        this.prevent(e);
        this.isHovered = false;
    }

    fileDrop(e: DragEvent) {
        this.hoverEnd(e);
        this.processFiles(e.dataTransfer?.files);
    }

    fileSelected(e: Event) {
        this.processFiles((e.target as HTMLInputElement)?.files);
    }

    private processFiles(files: FileList | undefined | null) {
        this._fileReader.processFileUpload(files).pipe(take(1)).subscribe(result => {
            if (result.length > 0) {
                this.fileContentEmitter.emit(result);
            }
        });
    }
}
