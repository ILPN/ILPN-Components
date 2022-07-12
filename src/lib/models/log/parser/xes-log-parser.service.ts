import {Injectable} from '@angular/core';
import {Trace} from '../model/trace';

@Injectable({
    providedIn: 'root'
})
export class XesLogParserService {

    constructor() {
    }

    parse(text: string): Array<Trace> {

    }
}
