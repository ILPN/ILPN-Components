import {PrefixGraphNode} from './prefix-graph-node';
import {MultisetEquivalent} from '../multiset/multiset-equivalent';
import {StringSequence} from '../string-sequence';
import {MultisetMap} from '../multiset/multiset-map';
import {addToMultiset, cloneMultiset, Multiset} from '../multiset/multiset';


class MultisetEquivalentWrapper<T> extends MultisetEquivalent {

    public wrapped: T & MultisetEquivalent;
    public node?: PrefixGraphNode<T & MultisetEquivalent>;

    constructor(wrapped: T & MultisetEquivalent) {
        super(wrapped.multiset);
        this.wrapped = wrapped;
    }

    merge(ms: MultisetEquivalent): void {
        this.wrapped.merge(ms);
    }

}

export class PrefixMultisetStateGraph<T> {

    private readonly _root: PrefixGraphNode<T & MultisetEquivalent>;
    private readonly _stateMap: MultisetMap<MultisetEquivalentWrapper<T & MultisetEquivalent>>;

    constructor(rootContent: T & MultisetEquivalent) {
        this._root = new PrefixGraphNode<T & MultisetEquivalent>(rootContent);
        this._stateMap = new MultisetMap<MultisetEquivalentWrapper<T & MultisetEquivalent>>();
    }

    public insert(path: StringSequence,
                  newStepNode: (step: string, newState: Multiset, previousNode: T & MultisetEquivalent) => (T & MultisetEquivalent),
                  newEdgeReaction: (step: string, previousNode: T & MultisetEquivalent) => void = () => {},
                  finalNodeReaction: (node: T & MultisetEquivalent) => void = () => {}) {
        let currentNode = this._root;
        for (let i = 0; i < path.length(); i++) {
            const step = path.get(i);
            let child = currentNode.getChild(step);
            if (child !== undefined) {
                currentNode = child;
                continue;
            }
            const nextMultiset = this.stepState(currentNode.content!.multiset, step);
            let nextState = this._stateMap.get(nextMultiset);
            if (nextState === undefined) {
                nextState = new MultisetEquivalentWrapper<T & MultisetEquivalent>(newStepNode(step, nextMultiset, currentNode.content!));
                this._stateMap.put(nextState);
            }
            newEdgeReaction(step, currentNode.content!);
            let nextNode = nextState.node;
            if (nextNode === undefined) {
                nextNode = currentNode.addChild(step, nextState.wrapped);
                nextState.node = nextNode;
            } else {
                currentNode.addChild(step, nextNode);
            }
            currentNode = nextNode;
        }
        finalNodeReaction(currentNode.content!);
    }

    private stepState(currentState: Multiset, step: string): Multiset {
        const clone = cloneMultiset(currentState);
        addToMultiset(clone, step);
        return clone;
    }

    public getGraphStates(): Array<T & MultisetEquivalent> {
        return this._stateMap.values().map(w => w.wrapped);
    }
}
