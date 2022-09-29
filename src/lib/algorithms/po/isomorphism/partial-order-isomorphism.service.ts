import {Injectable} from '@angular/core';
import {PartialOrder} from '../../../models/po/model/partial-order';
import {Event} from '../../../models/po/model/event';
import {IsomorphismCandidate} from './model/isomorphism-candidate';

@Injectable({
    providedIn: 'root'
})
export class PartialOrderIsomorphismService {

    constructor() {
    }

    public arePartialOrdersIsomorphic(partialOrderA: PartialOrder, partialOrderB: PartialOrder): boolean {
        partialOrderA.determineInitialAndFinalEvents();
        partialOrderB.determineInitialAndFinalEvents();

        const unsolved: Array<IsomorphismCandidate> = [];
        for (const initialEvent of partialOrderA.initialEvents) {
            unsolved.push(new IsomorphismCandidate(initialEvent, Array.from(partialOrderB.initialEvents)));
        }

        const mappingAB = new Map<string, Event>();
        const mappingBA = new Map<string, Event>();
        while (unsolved.length > 0) {
            const problem = unsolved.shift()!;
            const previous: Array<Event> = Array.from(problem.target.previousEvents);
            if (previous.some(p => !mappingAB.has(p.id))) {
                // pre-set was not yet determined, we have to wait
                // TODO prevent infinite looping
                unsolved.push(problem);
                continue;
            }
            problem.candidates = problem.candidates.filter(c => !mappingBA.has(c.id));

            const match = problem.candidates.find(c => {
                const sameLabel = c.label === problem.target.label;
                if (!sameLabel) {
                    return false;
                }
                if (c.previousEvents.size !== problem.target.previousEvents.size) {
                    return false;
                }
                if (c.nextEvents.size !== problem.target.nextEvents.size) {
                    return false;
                }
                const previousLabels = new Set(Array.from(c.previousEvents).map(p => p.label!));
                for (const p of problem.target.previousEvents) {
                    if (!previousLabels.has(p.label!)) {
                        return false;
                    }
                    previousLabels.delete(p.label!);
                }
                return true;
            });
            if (match === undefined) {
                return false;
            }

            mappingAB.set(problem.target.id, match);
            mappingBA.set(match.id, problem.target);

            for(const next of problem.target.nextEvents) {
                unsolved.push(new IsomorphismCandidate(next, Array.from(match.nextEvents)));
            }
        }

        return true;
    }
}
