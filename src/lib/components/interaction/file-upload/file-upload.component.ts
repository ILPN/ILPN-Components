import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {FileReaderService} from '../../../utility/file-reader.service';
import {catchError, forkJoin, Observable, of, take} from 'rxjs';
import {DropFile} from '../../../utility/drop-file';
import {FileDisplay} from '../../layout/file-display';
import {DescriptiveLinkComponent} from "../descriptive-link/descriptive-link.component";
import {HttpClient} from "@angular/common/http";


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

    constructor(private _fileReader: FileReaderService, private _http: HttpClient) {
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

        const linkData = e.dataTransfer?.getData(DescriptiveLinkComponent.DRAG_DATA_KEY);
        if (linkData) {
            this.processLinks(linkData);
        } else {
            this.processFiles(e.dataTransfer?.files);
        }
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

    private processLinks(links: string) {
        const linkData$: Array<Observable<string | undefined>> = [];

        if (!links.startsWith('[')) {
            linkData$.push(this.fetchLinkData(links));
        } else {
            const parsed = JSON.parse(links) as Array<string>;
            for (const l of parsed) {
                linkData$.push(this.fetchLinkData(l));
            }
        }

        forkJoin(linkData$).pipe(take(1)).subscribe(results => {
            this.fileContentEmitter.emit(results.filter(r => !!r).map(r => new DropFile('', r as string)));
        });
    }

    private fetchLinkData(link: string): Observable<string | undefined> {
        return this._http.get(link, {
            responseType: 'text'
        }).pipe(
            catchError(err => {
                console.error('fetch data error', err);
                return of(undefined);
            })
        );
    }
}
