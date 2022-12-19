import {Injectable} from '@angular/core';
import {forkJoin, Observable, of, ReplaySubject} from 'rxjs';
import {DropFile} from './drop-file';

@Injectable({
    providedIn: 'root'
})
export class FileReaderService {

    processFileUpload(files: FileList | undefined | null): Observable<Array<DropFile>> {
        if (files === undefined || files === null) {
            return of([]);
        }
        const files$: Array<Observable<DropFile>> = [];
        for (let i = 0; i < files.length; i++) {
            files$.push(this.readFile(files[i]));
        }

        return forkJoin(files$);
    }

    private readFile(file: File): Observable<DropFile> {
        const reader = new FileReader();
        const result = new ReplaySubject<DropFile>(1);
        reader.onerror = (e) => {
            console.debug('Error while reading file content', file, e);
            result.complete();
        };
        reader.onloadend = () => {
            result.next(new DropFile(file.name, reader.result as string));
            result.complete();
        }
        reader.readAsText(file);
        return result.asObservable();
    }
}
