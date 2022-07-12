import {Lifecycle} from './lifecycle';

export class Event {
    public resource?: string;
    public timestamp?: Date;
    public lifecycle?: Lifecycle;
    private _attributes: Map<string, string>;

    constructor(public name: string) {
        this._attributes = new Map<string, string>();
    }

    public getAttribute(name: string): string | undefined {
        return this._attributes.get(name);
    }

    public setAttribute(name: string, value: string) {
        this._attributes.set(name, value);
    }
}
