import {Injectable} from '@angular/core';
import {Trace} from '../model/trace';
import {LogEvent} from '../model/logEvent';
import {Lifecycle} from '../model/lifecycle';

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
            result.push(this.parseTrace(traceElements.item(i)!));
        }

        return result;
    }

    private parseTrace(element: Element): Trace {
        const trace = this.createTrace(element.querySelectorAll('trace > string'));

        const events = element.getElementsByTagName("event");
        for (let i = 0; i < events.length; i++) {
            trace.appendEvent(this.parseEvent(events.item(i)!));
        }

        return trace;
    }

    private createTrace(traceAttributes: NodeListOf<Element>): Trace {
        const trace = new Trace();

        const attributes = this.parseKeyValue(traceAttributes);

        this.setIfPresent('concept:name', attributes, name => {
            trace.name = name;
        })

        this.setIfPresent('description', attributes, description => {
            trace.description = description;
        });

        for (const key of attributes.keys()) {
            console.debug(`unknown xml attribute key '${key}'`, traceAttributes);
        }

        return trace;
    }

    private parseEvent(element: Element): LogEvent {
        const stringAttributes = this.parseKeyValue(element.getElementsByTagName('string'));

        const name = this.getAndRemove('concept:name', stringAttributes);
        if (name === undefined) {
            console.debug(element);
            throw new Error(`Event name is not defined!`);
        }

        const event = new LogEvent(name);

        this.setIfPresent('org:resource', stringAttributes, resource => {
            event.resource = resource;
        });
        this.setIfPresent('lifecycle:transition', stringAttributes, lifecycle => {
            event.lifecycle = lifecycle as Lifecycle;
        })
        for (const [key, value] of stringAttributes.entries()) {
            event.setAttribute(key, value);
        }

        const dateAttributes = this.parseKeyValue(element.getElementsByTagName('date'));
        this.setIfPresent('time:timestamp', dateAttributes, timestamp => {
            event.timestamp = new Date(timestamp);
        });
        for (const [key, value] of dateAttributes.entries()) {
            event.setAttribute(key, value);
        }

        return event;
    }

    private parseKeyValue(attributes: HTMLCollectionOf<Element> | NodeListOf<Element>): Map<string, string> {
        const result = new Map<string, string>();

        for (let i = 0; i < attributes.length; i++) {
            const element = attributes.item(i)!;
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

            result.set(key, value);
        }

        return result;
    }

    private getAndRemove(key: string, map: Map<string, string>): string | undefined {
        const result = map.get(key);
        map.delete(key);
        return result;
    }

    private setIfPresent(key: string, map: Map<string, string>, setter: (v: string) => void) {
        const value = this.getAndRemove(key, map);
        if (value !== undefined) {
            setter(value);
        }
    }
}
