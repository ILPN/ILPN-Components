export interface StringSequence {
    get(i: number): string;
    length(): number;
}

class PrefixTreeNode<T> {

    private _children: Map<string, PrefixTreeNode<T>>;
    private _content: T | undefined;

    constructor() {
        this._children = new Map();
    }

    get content(): T | undefined {
        return this._content;
    }

    set content(value: T | undefined) {
        this._content = value;
    }

    public getChild(key: string): PrefixTreeNode<T> | undefined {
        return this._children.get(key);
    }

    public addChild(key: string): PrefixTreeNode<T> {
        const child = new PrefixTreeNode<T>();
        this._children.set(key, child);
        return child;
    }
}

export class PrefixTree<T> {

    private readonly _root: PrefixTreeNode<T>;

    constructor() {
        this._root = new PrefixTreeNode<T>();
    }

    public insert(path: StringSequence,
                  newNodeContent: () => T,
                  updateNodeContent: (node: T) => void,
                  stepReaction: (step: string) => void = () => {}) {
        let currentNode = this._root;
        let createdLastNode = false;
        for (let i = 0; i < path.length(); i++) {
            const step = path.get(i);
            stepReaction(step);
            let child = currentNode.getChild(step);
            if (child === undefined) {
                currentNode = currentNode.addChild(step);
                createdLastNode = true;
            } else {
                createdLastNode = false;
                currentNode = child;
            }
        }
        if (!createdLastNode && currentNode.content !== undefined) {
            updateNodeContent(currentNode.content);
        } else {
            currentNode.content = newNodeContent();
        }
    }

}
