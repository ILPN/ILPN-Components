import {Component, EventEmitter, OnDestroy, Output} from '@angular/core';
import {FileReaderService} from '../../../../utility/file-reader.service';
import {catchError, forkJoin, map, Observable, of, take} from 'rxjs';
import {DropFile} from '../../../../utility/drop-file';
import {DescriptiveLinkComponent} from "../../descriptive-link/descriptive-link.component";
import {HttpClient} from "@angular/common/http";


@Component({
    selector: 'ilpn-abstract-file-upload',
    template: ''
})
export abstract class AbstractFileUploadComponent implements OnDestroy {

    @Output('fileContent') fileContentEmitter: EventEmitter<Array<DropFile>>;

    isHovered = false;

    protected constructor(protected _fileReader: FileReaderService, protected _http: HttpClient) {
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

        const linkData = this.getLinkDataFromEvent(e);
        if (linkData) {
            this.processLinks(linkData);
        } else {
            this.processFiles(this.getFileDataFromEvent(e));
        }
    }

    protected getLinkDataFromEvent(e: DragEvent): string | undefined {
        return e.dataTransfer?.getData(DescriptiveLinkComponent.DRAG_DATA_KEY);
    }

    protected getFileDataFromEvent(e: DragEvent): FileList | undefined | null {
        return e.dataTransfer?.files;
    }

    protected processFiles(files: FileList | undefined | null) {
        this._fileReader.processFileUpload(files).pipe(take(1)).subscribe(result => {
            if (result.length > 0) {
                this.fileContentEmitter.emit(result);
            }
        });
    }

    protected processLinks(links: string) {
        const linkData$: Array<Observable<DropFile | undefined>> = [];

        if (!links.startsWith('[')) {
            linkData$.push(this.fetchLinkData(links));
        } else {
            const parsed = JSON.parse(links) as Array<string>;
            for (const l of parsed) {
                linkData$.push(this.fetchLinkData(l));
            }
        }

        forkJoin(linkData$).pipe(take(1)).subscribe(results => {
            this.fileContentEmitter.emit(results.filter(r => !!r) as Array<DropFile>);
        });
    }

    protected fetchLinkData(link: string): Observable<DropFile | undefined> {
        return this._http.get(link, {
            responseType: 'text'
        }).pipe(
            map((content: string) => {
                const linkParts = link.split('/');
                return new DropFile(linkParts[linkParts.length - 1], content);
            }),
            catchError(err => {
                console.error('fetch data error', err);
                return of(undefined);
            })
        );
    }
}
