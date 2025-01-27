import {Component, Input} from '@angular/core';
import {FileReaderService} from '../../../../utility/file-reader.service';
import {FileDisplay} from '../../../layout/file-display';
import {HttpClient} from "@angular/common/http";
import {AbstractFileUploadComponent} from "../abstract-file-upload/abstract-file-upload.component";


@Component({
    selector: 'ilpn-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent extends AbstractFileUploadComponent {

    @Input() descriptionText: string = '';
    @Input() squareContent: string | undefined;
    @Input() showText = true;
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() bold: boolean | undefined;

    constructor(fileReader: FileReaderService, http: HttpClient) {
        super(fileReader, http);
    }

    fileSelected(e: Event) {
        this.processFiles((e.target as HTMLInputElement)?.files);
    }
}
