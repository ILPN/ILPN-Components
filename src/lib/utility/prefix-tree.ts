import {StringSequence} from './string-sequence';

export class PrefixTreeNode<T> {

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

    public hasChildren(): boolean {
        return this._children.size !== 0;
    }
}

export class PrefixTree<T> {

    private readonly _root: PrefixTreeNode<T>;

    constructor(rootContent?: T) {
        this._root = new PrefixTreeNode<T>(rootContent);
    }

    public insert(path: StringSequence,
                  newNodeContent: () => T,
                  updateNodeContent: (node: T, treeWrapper: PrefixTreeNode<T>) => void,
                  stepReaction: (step: string, previousNode: T | undefined, previousTreeWrapper: PrefixTreeNode<T>) => void = () => {},
                  newStepNode: (step: string, prefix: Array<string>, previousNode: T | undefined) => T | undefined = () => undefined) {
        let currentNode = this._root;
        const prefix: Array<string> = [];
        for (let i = 0; i < path.length(); i++) {
            const step = path.get(i);
            stepReaction(step, currentNode.content, currentNode);
            let child = currentNode.getChild(step);
            if (child === undefined) {
                currentNode = currentNode.addChild(step, newStepNode(step, [...prefix], currentNode.content));
            } else {
                currentNode = child;
            }
            prefix.push(step);
        }
        if (currentNode.content !== undefined) {
            updateNodeContent(currentNode.content, currentNode);
        } else {
            currentNode.content = newNodeContent();
        }
    }

}
