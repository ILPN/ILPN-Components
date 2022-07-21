import {Injectable} from '@angular/core';
import {PetriNet} from '../model/petri-net';
import {Place} from '../model/place';
import {Transition} from '../model/transition';
import {Arc} from '../model/arc';
import {SourceAndDestination} from './source-and-destination';
import {Node} from '../model/node';
import {AbstractParser} from '../../../utility/abstract-parser';
import {BlockType} from './block-type';

@Injectable({
    providedIn: 'root'
})
export class PetriNetParserService extends AbstractParser<PetriNet> {

    constructor() {
        super(
            'pn',
            [BlockType.PLACES, BlockType.TRANSITIONS, BlockType.ARCS]
        );
    }

    protected newResult(): PetriNet {
        return new PetriNet();
    }

    protected resolveBlockParser(block: string): ((lines: Array<string>, result: PetriNet) => void) | undefined {
        switch (block) {
            case BlockType.PLACES:
                return (lines, result) => this.parsePlaces(lines, result);
            case BlockType.TRANSITIONS:
                return (lines, result) => this.parseTransitions(lines, result);
            case BlockType.ARCS:
                return (lines, result) => this.parseArcs(lines, result);
            default:
                return undefined;
        }
    }

    private parsePlaces(lines: Array<string>, net: PetriNet) {
        this.parseEachLine(lines, (parts, line) => {
            if (parts.length !== 2) {
                throw new Error(`line '${line}' does not have the correct number of elements! Place definition must contain exactly two elements!`);
            }
            const initialMarking = parseInt(parts[1])
            if (isNaN(initialMarking)) {
                throw new Error(`line '${line}' marking cannot be parsed into a number! Place marking must be a non-negative integer!`);
            }
            if (initialMarking < 0) {
                throw new Error(`line '${line}' marking is less than 0! Place marking must be a non-negative integer!`);
            }
            if (net.getPlace(parts[0]) !== undefined || net.getTransition(parts[0]) !== undefined) {
                throw new Error(`line '${line}' place ids must be unique!`);
            }
            const place = new Place(initialMarking, 0, 0, parts[0]);
            net.addPlace(place);
        });
    }

    private parseTransitions(lines: Array<string>, net: PetriNet) {
        this.parseEachLine(lines, (parts, line) => {
            if (parts.length < 1 || parts.length > 2) {
                throw new Error(`line '${line}' does not have the correct number of elements! Transition definition must contain one or two elements!`);
            }
            if (net.getTransition(parts[0]) !== undefined || net.getPlace(parts[0]) !== undefined) {
                throw new Error(`line '${line}' transition ids must be unique!`);
            }
            net.addTransition(new Transition(parts[1], 0, 0, parts[0]))
        });
    }

    private parseArcs(lines: Array<string>, net: PetriNet) {
        this.parseEachLine(lines, (parts, line) => {
            if (parts.length < 2 || parts.length > 3) {
                throw new Error(`line '${line}' does not have the correct number of elements! Arc definition must contain two or three elements!`);
            }
            let weight = 1;
            if (parts.length === 3) {
                weight = parseInt(parts[2])
                if (isNaN(weight)) {
                    throw new Error(`line '${line}' arc weight cannot be parsed into a number! Arc weight must be a positive integer!`);
                }
                if (weight < 1) {
                    throw new Error(`line '${line}' arc weight is less than 1! Arc weight must be a positive integer!`);
                }
            }
            const srcDest = this.extractSourceAndDestination(parts[0], parts[1], line, net);

            const arcId = parts[0] + ' ' + parts[1];
            if (net.getArc(arcId) !== undefined) {
                throw new Error(`line '${line}' duplicate arcs between elements are not allowed!`);
            }

            const arc = new Arc(arcId, srcDest.source, srcDest.destination, weight);
            net.addArc(arc);
        });
    }

    private extractSourceAndDestination(sourceId: string, destinationId: string, line: string, net: PetriNet): SourceAndDestination {
        let source: Node | undefined = net.getPlace(sourceId);
        let destination: Node | undefined = net.getTransition(destinationId);
        if (!!source && !!destination) {
            return {source, destination};
        }
        source = net.getTransition(sourceId);
        destination = net.getPlace(destinationId);
        if (!!source && !!destination) {
            return {source, destination};
        }
        throw new Error(`line '${line}' arc source or destination is invalid! Arc must reference existing net elements and connect a place with a transition or a transition with a place!`);
    }
}
