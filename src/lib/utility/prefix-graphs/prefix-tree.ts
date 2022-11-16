import {StringSequence} from '../string-sequence';
import {PrefixGraphNode} from './prefix-graph-node';


export class PrefixTree<T> {

    private readonly _root: PrefixGraphNode<T>;

    constructor(rootContent?: T) {
        this._root = new PrefixGraphNode<T>(rootContent);
    }

    public insert(path: StringSequence,
                  newNodeContent: () => T | undefined,
                  updateNodeContent: (node: T, treeWrapper: PrefixGraphNode<T>) => void,
                  stepReaction: (step: string, previousNode: T | undefined, previousTreeWrapper: PrefixGraphNode<T>) => void = () => {},
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
