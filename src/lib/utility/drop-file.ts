export class DropFile {

    private _name!: string;
    private _suffix!: string;

    constructor(name: string, public readonly content: string, suffix?: string) {
        this.extractSuffix(name);
        if (suffix !== undefined) {
            this._suffix = suffix;
        }
    }

    get name(): string {
        return `${this._name}.${this.suffix}`;
    }

    set name(name: string) {
        this.extractSuffix(name)
    }

    get suffix(): string {
        return this._suffix;
    }

    set suffix(value: string) {
        this._suffix = value;
    }

    private extractSuffix(name: string) {
        const parts = name.split('.');
        if (parts.length === 1) {
            this._name = name;
            this._suffix = '';
        } else {
            this._suffix = parts.splice(-1)[0];
            this._name = parts.join('.');
        }
    }
}
