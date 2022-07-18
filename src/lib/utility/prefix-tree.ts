export interface StringSequence {
    get(i: number): string;
    length(): number;
}

class PrefixTreeNode<T> {

    private _children: Map<string, PrefixTreeNode<T>>;
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

    public getChild(key: string): PrefixTreeNode<T> | undefined {
        return this._children.get(key);
    }

    public addChild(key: string, content?: T): PrefixTreeNode<T> {
        const child = new PrefixTreeNode<T>(content);
        this._children.set(key, child);
        return child;
    }
}

export class PrefixTree<T> {

    private readonly _root: PrefixTreeNode<T>;

    constructor(rootContent?: T) {
        this._root = new PrefixTreeNode<T>(rootContent);
    }

    public insert(path: StringSequence,
                  newNodeContent: () => T,
                  updateNodeContent: (node: T) => void,
                  stepReaction: (step: string, previousNode?: T) => void = () => {},
                  newStepNode: (step: string, previousNode?: T) => T | undefined = () => undefined) {
        let currentNode = this._root;
        for (let i = 0; i < path.length(); i++) {
            const step = path.get(i);
            stepReaction(step, currentNode.content);
            let child = currentNode.getChild(step);
            if (child === undefined) {
                currentNode = currentNode.addChild(step, newStepNode(step, currentNode.content));
            } else {
                currentNode = child;
            }
        }
        if (currentNode.content !== undefined) {
            updateNodeContent(currentNode.content);
        } else {
            currentNode.content = newNodeContent();
        }
    }

}
