import {SILENT_TRANSITION_STYLE, TRANSITION_STYLE} from '../../internals/constants/transition-style';
import {PLACE_STYLE} from '../../internals/constants/place-style';
import {Node} from '../../../../models/pn/model/node';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Arc} from '../../../../models/pn/model/arc';
import {DragPoint} from '../../svg-net/drag-point';
import {SvgPetriNet} from '../../svg-net/svg-petri-net';
import {SvgWrapper} from '../../svg-net/svg-wrapper';
import {SvgPlace} from '../../svg-net/svg-place';
import {SvgTransition} from '../../svg-net/svg-transition';
import {PetriNetLayoutManager} from "../petri-net-layout.manager";
import {Observable, of} from "rxjs";
import {BoundingBox} from "../../../../utility/svg/bounding-box";


/**
 * Sugiyama algorithm implemented loosely based on: https://blog.disy.net/sugiyama-method/
 *
 * Does not implement crossings minimisation.
 */
export class SugiyamaLayoutManager extends PetriNetLayoutManager {

    private readonly LAYER_OFFSET = 50;
    private readonly NODE_OFFSET = 40;

    public layout(net: SvgPetriNet): Observable<BoundingBox> {
        const acyclicArcs = this.removeCycles(net.getNet());
        const acyclicNet = PetriNet.createFromArcSubset(net.getNet(), acyclicArcs);
        const layeredNodes = this.assignLayers(acyclicNet);

        const layerAssignment = new Map<string, number>(); // id -> layer

        const layeredWrappers = layeredNodes.map((layer, index) => layer.map(node => {
            const n = net.getMappedWrapper(node)!;
            layerAssignment.set(n.getId(), index);
            return n;
        })) as Array<Array<SvgWrapper>>;

        this.addBreakpoints(net, layeredWrappers, layerAssignment);
        let maxPerLayer = 0;
        for (const layer of layeredWrappers) {
            maxPerLayer = Math.max(maxPerLayer, layer.length);
        }

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

        let maxX = 0;
        let maxY = 0;
        for (let layerIndex = 0; layerIndex < layeredWrappers.length; layerIndex++) {
            const layer = layeredWrappers[layerIndex];
            const EXTRA_NODE_SPACING = layer.length < maxPerLayer ? (NODE_SPACING * (maxPerLayer - layer.length)) / (layer.length + 1) : 0;
            for (let svgIndex = 0; svgIndex < layer.length; svgIndex++) {
                const svg = layer[svgIndex];

                svg.registerLayer(layer, svgIndex);

                let svgWidth;
                const x = layerIndex * LAYER_SPACING + CELL_WIDTH/2;
                if (svg instanceof SvgTransition && svg.isSilent()) {
                    // silent transition
                    svgWidth = silentTransitionWidth;
                } else if (!(svg instanceof SvgTransition || svg instanceof SvgPlace)) {
                    // breakpoint
                    svgWidth = 0;
                } else {
                    // transition or place
                    svgWidth = CELL_WIDTH;
                }

                let svgHeight = CELL_HEIGHT;
                const y = svgIndex * NODE_SPACING + (svgIndex + 1) * EXTRA_NODE_SPACING + CELL_HEIGHT/2;
                if (!(svg instanceof SvgTransition || svg instanceof SvgPlace)) {
                    // breakpoint
                    svgHeight = 0;
                }
                svg.center = {x, y};

                maxX = Math.max(maxX, x + svgWidth/2);
                maxY = Math.max(maxY, y + svgHeight/2);
            }
        }

        return of({tl:{x:0, y:0}, br: {x: maxX, y: maxY}});
    }

    private removeCycles(net: PetriNet): Array<Arc> {
        const stack = new Set<Node>();
        const marked = new Set<Node>();

        const arcs = net.getArcs();

        const vertices: Array<Node> = net.getPlaces();
        vertices.push(...net.getTransitions());
        vertices.sort((a,b) => {
            const ingoing = a.ingoingArcWeights.size - b.ingoingArcWeights.size;
            if (ingoing !== 0) {
                return ingoing;
            }
            return b.outgoingArcWeights.size - a.outgoingArcWeights.size;
        });
        for (const v of vertices) {
            this.dfsRemoveCycles(v, stack, marked, arcs);
        }
        return arcs;
    }

    private dfsRemoveCycles(vertex: Node, stack: Set<Node>, marked: Set<Node>, arcs: Array<Arc>) {
        if (marked.has(vertex)) {
            return;
        }
        marked.add(vertex);
        stack.add(vertex);
        for (const arc of vertex.outgoingArcs) {
            if (stack.has(arc.destination)) {
                this.removeArc(arcs, arc);
            } else if (!marked.has(arc.destination)) {
                this.dfsRemoveCycles(arc.destination, stack, marked, arcs);
            }
        }
        stack.delete(vertex);
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

    private addBreakpoints(net: SvgPetriNet, wrappers: Array<Array<SvgWrapper>>, nodeLayer: Map<string, number>) {
        for (let layerI = 0; layerI < wrappers.length; layerI++) {
            for (const svg of wrappers[layerI]) {
                if (!(svg instanceof SvgPlace || svg instanceof SvgTransition)) {
                    break;
                }

                const node = net.getInverseMappedNode(svg)!;
                for(const arc of node.outgoingArcs) {
                    const destinationLayer = nodeLayer.get(arc.destination.id!) as number;
                    const diff = destinationLayer - layerI;
                    if (Math.abs(diff) == 1) {
                        continue;
                    }

                    const change = Math.sign(diff);
                    for (let i = layerI + change; i != destinationLayer; i += change) {
                        const breakpoint = new DragPoint();
                        wrappers[i].push(breakpoint);
                        net.getMappedArc(arc).addBreakpoint(breakpoint);
                    }
                }
            }
        }
    }

    getMouseMovedReaction(wrapper: SvgWrapper): (e: MouseEvent) => void {
        return (e) => {
            wrapper.processMouseMovedLayered(e);
        };
    }

}
