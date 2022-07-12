import {Injectable} from '@angular/core';
import {Trace} from '../model/trace';

@Injectable({
    providedIn: 'root'
})
export class XesLogParserService {

    constructor() {
    }

    parse(text: string): Array<Trace> {
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        return this.parseTraces(xml.getElementsByTagName('trace'));
    }

    private parseTraces(traceElements: HTMLCollectionOf<Element>): Array<Trace> {
        const result: Array<Trace> = [];

        for (let i = 0; i < traceElements.length; i++) {
            const trace = this.parseTrace(traceElements.item(i)!)
        }

        return result;
    }

    private parseTrace(element: Element): Trace {
        const trace = this.createTrace(element.getElementsByTagName('string'));

        return trace;
    }

    private createTrace(traceAttributes: HTMLCollectionOf<Element>): Trace {
        const trace = new Trace();

        for (let i = 0; i < traceAttributes.length; i++) {
            const element = traceAttributes.item(i)!;
            const elementAttributes = element.attributes;

            const valueAttribute = elementAttributes.getNamedItem('value');
            if (valueAttribute === null) {
                console.debug(`xml element has no attribute 'value'`, element);
                continue;
            }

            const value = valueAttribute.value;

            const keyAttribute = elementAttributes.getNamedItem('key');
            if (keyAttribute === null) {
                console.debug(`xml element has no attribute 'key'`, element);
                continue;
            }

            const key = keyAttribute.value;
            switch (key) {
                case 'concept:name':
                    trace.name = value;
                    break;
                case 'description':
                    trace.description = value;
                    break;
                default:
                    console.debug(`unknown xml attribute key '${key}'`, element);
            }
        }

        return trace;
    }
}
