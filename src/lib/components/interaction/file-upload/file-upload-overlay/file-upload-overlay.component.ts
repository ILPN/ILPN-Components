import {Component, HostListener} from '@angular/core';
import {FileReaderService} from '../../../../utility/file-reader.service';
import {HttpClient} from "@angular/common/http";
import {AbstractFileUploadComponent} from "../abstract-file-upload/abstract-file-upload.component";


@Component({
    selector: 'ilpn-file-upload-overlay',
    templateUrl: './file-upload-overlay.component.html',
    styleUrls: ['./file-upload-overlay.component.scss']
})
export class FileUploadOverlayComponent extends AbstractFileUploadComponent {

    constructor(fileReader: FileReaderService, http: HttpClient) {
        super(fileReader, http);
    }

    @HostListener('document:dragend', ['$event'])
    globalDragEnd(e: DragEvent) {
        if (this.isHovered) {
            this.isHovered = false;
        }
    }

    hoverStartCheck(e: DragEvent) {
        if (this.hasDragData(e)) {
            super.hoverStart(e);
        }
    }

    hoverEndCheck(e: DragEvent) {
        if (this.isHovered) {
            super.hoverEnd(e);
        }
    }

    propagate(e: Event) {
        e.preventDefault();
        if (this.isHovered) {
            e.stopPropagation();
        }
    }

    private hasDragData(e: DragEvent): boolean {
        return this.getLinkDataFromEvent(e) !== undefined || !!this.getFileDataFromEvent(e)
    }
}
