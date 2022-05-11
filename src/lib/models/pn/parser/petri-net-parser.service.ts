import {Injectable} from '@angular/core';
import {PetriNet} from '../model/petri-net';
import {Blocks} from './blocks';
import {Place} from '../model/place';
import {Transition} from '../model/transition';
import {Arc} from '../model/arc';
import {SourceAndDestination} from './source-and-destination';
import {Node} from '../model/node';

@Injectable({
    providedIn: 'root'
})
export class PetriNetParserService {

    constructor() {
    }

    parse(text: string): PetriNet | undefined {
        const lines = text.split('\n');
        if (lines[0].trimEnd() !== `${Blocks.TYPE} pn`) {
            console.debug('bad file type')
            return;
        }

        const result = new PetriNet();

        let currentBlock: Blocks | undefined = undefined;
        let blockStart = -1;
        try {
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trimEnd();
                if (!line.startsWith('.')) {
                    continue;
                }
                if (line.startsWith(Blocks.TRANSITIONS)) {
                    if (currentBlock !== undefined) {
                        this.parseBlock(lines.slice(blockStart, i), result, currentBlock);
                    }
                    blockStart = i + 1;
                    currentBlock = Blocks.TRANSITIONS;
                } else if (line.startsWith(Blocks.PLACES)) {
                    if (currentBlock !== undefined) {
                        this.parseBlock(lines.slice(blockStart, i), result, currentBlock);
                    }
                    blockStart = i + 1;
                    currentBlock = Blocks.PLACES;
                } else if (line.startsWith(Blocks.ARCS)) {
                    if (currentBlock !== undefined) {
                        this.parseBlock(lines.slice(blockStart, i), result, currentBlock);
                    }
                    blockStart = i + 1;
                    currentBlock = Blocks.ARCS;
                }
            }
            if (currentBlock !== undefined) {
                this.parseBlock(lines.slice(blockStart), result, currentBlock);
            }
        } catch (e) {
            console.error((e as Error).message);
            return undefined;
        }

        return result;
    }

    private parseBlock(lines: Array<string>, net:PetriNet, block: Blocks) {
        switch (block) {
            case Blocks.PLACES:
                this.parsePlaces(lines, net);
                return;
            case Blocks.TRANSITIONS:
                this.parseTransitions(lines, net);
                return
            case Blocks.ARCS:
                this.parseArcs(lines, net);
                return;
        }
    }

    private parsePlaces(lines: Array<string>, net: PetriNet) {
        for (let i = 0; i < lines.length; i++) {
            const line = this.prepareLine(lines, i);
            if (line.length === 0) {
                continue;
            }
            const parts = line.split(' ');
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
            const place = new Place(parts[0], 0, 0, initialMarking);
            net.addPlace(place);
        }
    }

    private parseTransitions(lines: Array<string>, net: PetriNet) {
        for (let i = 0; i < lines.length; i++) {
            const line = this.prepareLine(lines, i);
            if (line.length === 0) {
                continue;
            }
            const parts = line.split(' ');
            if (parts.length < 1 || parts.length > 2) {
                throw new Error(`line '${line}' does not have the correct number of elements! Transition definition must contain one or two elements!`);
            }
            if (net.getTransition(parts[0]) !== undefined || net.getPlace(parts[0]) !== undefined) {
                throw new Error(`line '${line}' transition ids must be unique!`);
            }
            net.addTransition(new Transition(parts[0], 0, 0, parts[1]))
        }
    }

    private parseArcs(lines: Array<string>, net: PetriNet) {
        for (let i = 0; i < lines.length; i++) {
            const line = this.prepareLine(lines, i);
            if (line.length === 0) {
                continue;
            }
            const parts = line.split(' ');
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
        }
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

    private prepareLine(lines: Array<string>, index: number): string {
        return lines[index].trimEnd();
    }
}