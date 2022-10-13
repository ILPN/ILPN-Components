import {Injectable} from '@angular/core';
import {SILENT_TRANSITION_STYLE, TRANSITION_STYLE} from '../constants/transition-style';
import {PLACE_STYLE} from '../constants/place-style';
import {Node} from '../../../../models/pn/model/node';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Point} from '../../../../models/pn/model/point';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {Arc} from '../../../../models/pn/model/arc';
import {DragPoint} from '../../../../models/pn/model/drag-point';
import {IdPoint} from '../../../../models/pn/model/id-point';

@Injectable({
    providedIn: 'root'
})
export class PnLayoutingService {

    private readonly LAYER_OFFSET = 50;
    private readonly NODE_OFFSET = 40;

    public layout(net: PetriNet): Point {
        const transitionWidth = parseInt(TRANSITION_STYLE.width);
        const transitionHeight = parseInt(TRANSITION_STYLE.height);
        const silentTransitionWidth = parseInt(SILENT_TRANSITION_STYLE.width);
        const silentTransitionHeight = parseInt(SILENT_TRANSITION_STYLE.height);
        const placeWidth = parseInt(PLACE_STYLE.r) * 2;
        const placeHeight = parseInt(PLACE_STYLE.r) * 2;

        const CELL_WIDTH = Math.max(transitionWidth, silentTransitionWidth, placeWidth);
        const CELL_HEIGHT = Math.max(transitionHeight, silentTransitionHeight, placeHeight);

        const LAYER_SPACING = this.LAYER_OFFSET + CELL_WIDTH;
        const NODE_SPACING = this.NODE_OFFSET + CELL_HEIGHT;

        // Sugiyama algorithm implemented loosely based on: https://blog.disy.net/sugiyama-method/
        const acyclicArcs = this.removeCycles(net);
        const acyclicNet = PetriNet.createFromArcSubset(net, acyclicArcs);
        const layeredNodes = this.assignLayers(acyclicNet);

        const nodeLayer = new Map<string, number>(); // id -> layer

        const originalLayeredNodes = layeredNodes.map((layer, index) => layer.map(node => {
            const n = net.getTransition(node.id!) ?? net.getPlace(node.id!)! as Node;
            nodeLayer.set(n.id!, index);
            return n;
        })) as Array<Array<IdPoint>>;

        this.addBreakpoints(originalLayeredNodes, nodeLayer);
        let maxNodesPerLayer = 0;
        for (const layer of originalLayeredNodes) {
            maxNodesPerLayer = Math.max(maxNodesPerLayer, layer.length);
        }

        let maxX = 0;
        let maxY = 0;
        for (let layerIndex = 0; layerIndex < originalLayeredNodes.length; layerIndex++) {
            const layer = originalLayeredNodes[layerIndex];
            const EXTRA_NODE_SPACING = layer.length < maxNodesPerLayer ? (NODE_SPACING * (maxNodesPerLayer - layer.length)) / (layer.length + 1) : 0;
            for (let nodeIndex = 0; nodeIndex < layer.length; nodeIndex++) {
                const node = layer[nodeIndex];

                node.registerLayer(layer, nodeIndex);

                let nodeWidth;
                node.x = layerIndex * LAYER_SPACING + CELL_WIDTH/2;
                if (node instanceof Transition && node.isSilent) {
                    // silent transition
                    nodeWidth = silentTransitionWidth;
                } else if (!(node instanceof Transition) && !(node instanceof Place)) {
                    // breakpoint
                    nodeWidth = 0;
                } else {
                    // transition or place
                    nodeWidth = CELL_WIDTH;
                }

                let nodeHeight = CELL_HEIGHT;
                node.y = nodeIndex * NODE_SPACING + (nodeIndex + 1) * EXTRA_NODE_SPACING + CELL_HEIGHT/2;
                if (!(node instanceof Transition) && !(node instanceof Place)) {
                    // breakpoint
                    nodeHeight = 0;
                }

                maxX = Math.max(maxX, node.x + nodeWidth/2);
                maxY = Math.max(maxY, node.y + nodeHeight/2);
            }
        }

        return {x: maxX, y: maxY};
    }

    private removeCycles(net: PetriNet): Array<Arc> {
        const explored = new Set<Arc>();
        const arcs = net.getArcs();
        for (let i = 0; i < arcs.length; i++) {
            const arc = arcs[i];
            if (!explored.has(arc)) {
                this.dfsRemoveCycles(arc, explored, new Set([arc.source]), arcs);
            }
        }
        return arcs;
    }

    private dfsRemoveCycles(arc: Arc, explored: Set<Arc>, predecessors: Set<Node>, arcs: Array<Arc>) {
        if (explored.has(arc)) {
            return;
        }
        explored.add(arc);
        if (predecessors.has(arc.destination)) {
            this.removeArc(arcs, arc);
            return;
        }
        predecessors.add(arc.destination);
        for (const outgoingArc of arc.destination.outgoingArcs) {
            this.dfsRemoveCycles(outgoingArc, explored, predecessors, arcs);
        }
        predecessors.delete(arc.destination);
    }

    private removeArc(arcs: Array<Arc>, arc: Arc) {
        arcs.splice(arcs.findIndex(a => a === arc), 1);
    }

    private assignLayers(net: PetriNet): Array<Array<Node>> {
        let nodes = [...net.getPlaces(), ...net.getTransitions()];
        let arcs = net.getArcs();
        const result: Array<Array<Node>> = [];
        while (nodes.length > 0) {
            const currentLayerNodes = this.nodesWithoutIncomingArcs(nodes, arcs);
            const cln = new Set<Node>(currentLayerNodes);
            nodes = nodes.filter(n => !cln.has(n));
            const outgoingArcs = new Set<Arc>(currentLayerNodes.flatMap(n => n.outgoingArcs));
            arcs = arcs.filter(a => !outgoingArcs.has(a));
            result.push(currentLayerNodes);
        }
        return result;
    }

    private nodesWithoutIncomingArcs(nodes: Array<Node>, arcs: Array<Arc>): Array<Node> {
        const nodesWithIncomingArcs = new Set<Node>();
        arcs.forEach(a => {
            nodesWithIncomingArcs.add(a.destination);
        });
        return nodes.filter(n => !nodesWithIncomingArcs.has(n));
    }

    private addBreakpoints(nodes: Array<Array<IdPoint>>, nodeLayer: Map<string, number>) {
        for (let layerI = 0; layerI < nodes.length; layerI++) {
            for (const node of nodes[layerI]) {
                if (!(node instanceof Node)) {
                    break;
                }
                for(const arc of (node as Node).outgoingArcs) {
                    const destinationLayer = nodeLayer.get(arc.destination.id!) as number;
                    const diff = destinationLayer - layerI;
                    if (Math.abs(diff) == 1) {
                        continue;
                    }
                    const change = Math.sign(diff);
                    for (let i = layerI + change; i != destinationLayer; i += change) {
                        // this ID calculation does not guarantee a unique ID, which could be a problem in the future
                        const breakpoint = new DragPoint(0, 0, `${arc.id} #${i}`);
                        nodes[i].push(breakpoint);
                        arc.addBreakpoint(breakpoint);
                    }
                }
            }
        }
    }

    private forEachNodeByLayers(layeredNodes: Array<Array<Node>>, method: (node: Node, layerI: number, nodeI: number) => void, ascending = true) {
        for (let layerI = (ascending ? 0 : layeredNodes.length - 1); (ascending ? layerI < layeredNodes.length : layerI >= 0); ascending ? layerI++ : layerI--) {
            const layer = layeredNodes[layerI];
            for (let nodeI = 0; nodeI < layer.length; nodeI++) {
                const node = layer[nodeI];
                method(node, layerI, nodeI);
            }
        }
    }
}
