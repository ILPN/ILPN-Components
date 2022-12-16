export class PrefixGraphNode<T> {

    private _children: Map<string, PrefixGraphNode<T>>;
    private _content: T | undefined;

    constructor(content?: T) {
        this._children = new Map();
        this.content = content;
    }

    get content(): T | undefined {
        return this._content;
    }

    set content(value: T | undefined) {
        this._content = value;
    }

    public getChild(key: string): PrefixGraphNode<T> | undefined {
        return this._children.get(key);
    }

    public addChild(key: string, content?: T): PrefixGraphNode<T>;
    public addChild(key: string, content: PrefixGraphNode<T>): PrefixGraphNode<T>;
    public addChild(key: string, content?: T | PrefixGraphNode<T>): PrefixGraphNode<T> {
        let child;
        if (content instanceof PrefixGraphNode) {
            child = content;
        } else {
            child = new PrefixGraphNode<T>(content);
        }
        this._children.set(key, child);
        return child;
    }

    public hasChildren(): boolean {
        return this._children.size !== 0;
    }
}
