import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Place} from '../../../models/pn/model/place';
import {Transition} from '../../../models/pn/model/transition';
import {ConflictingPlace} from './model/conflicting-place';
import {FoldingStatus} from './model/folding-status';


@Injectable({
    providedIn: 'root'
})
export class BranchingProcessFoldingService {

    constructor() {
    }

    public foldPartialOrders(pos: Array<PetriNet>): PetriNet {
        if (pos.length === 0) {
            return new PetriNet();
        }
        const result = pos[0].clone();

        if (result.inputPlaces.size > 1) {
            throw new Error('Folding of initially concurrent processes is currently unsupported!');
        }

        for (let i = 1; i < pos.length; i++) {
            this.addPoToBranchingProcess(pos[i], result);
        }

        return result;
    }

    private addPoToBranchingProcess(po: PetriNet, result: PetriNet) {
        if (po.inputPlaces.size > 1) {
            throw new Error('Folding of initially concurrent processes is currently unsupported!');
        }

        const conflictQueue: Array<ConflictingPlace> = [{
            target: result.getInputPlaces()[0],
            conflict: po.getInputPlaces()[0]
        }];

        conflictResolution:
        while (conflictQueue.length > 0) {
            const problem = conflictQueue.shift()!;

            if (problem.conflict.foldingStatus === FoldingStatus.FOLDED) {
                continue;
            }

            if (problem.conflict.foldingStatus === FoldingStatus.CONFLICT) {
                conflictQueue.push(...this.addConflict(problem, result))
                continue;
            }

            const followingEvent = problem.conflict.outgoingArcs[0]?.destination as Transition;
            if (followingEvent === undefined) {
                // the conflicting place has no following event => there is no conflict to resolve
                continue;
            }

            if (followingEvent.ingoingArcs.length > 1) {
                for (const a of followingEvent.ingoingArcs) {
                    const p = a.source as Place;
                    if (p === problem.conflict) {
                        continue;
                    }
                    if (p.foldingStatus === FoldingStatus.CONFLICT) {
                        conflictQueue.push(problem);
                        problem.conflict.foldingStatus = FoldingStatus.CONFLICT;
                        continue conflictResolution;
                    }
                    if (p.foldingStatus === undefined) {
                        problem.conflict.foldingStatus = FoldingStatus.PENDING;
                        conflictQueue.push(problem);
                        continue conflictResolution;
                    }
                }
            }

            conflictQueue.push(...this.fold(problem.conflict, problem.target, followingEvent, po, result));
        }

        return result;
    }

    private fold(conflict: Place, target: Place, followingEvent: Transition, po: PetriNet, result: PetriNet): Array<ConflictingPlace> {
        let folding: Map<string, string> | undefined;
        for (const a of target.outgoingArcs) {
            const foldedEvent = a.destination as Transition;
            if (foldedEvent.label !== followingEvent.label) {
                continue;
            }

            folding = this.attemptEventFolding(followingEvent, foldedEvent);
            if (folding !== undefined) {
                break;
            }
        }

        if (folding !== undefined) {
            // the conflict can be resolved and the target place can be folded => move the conflict to the following places
            conflict.foldingStatus = FoldingStatus.FOLDED;
            conflict.foldedPair = target;

            if (followingEvent.ingoingArcs.length > 1) {
                for (const a of followingEvent.ingoingArcs) {
                    const p = a.source as Place;
                    if (p === conflict) {
                        continue;
                    }
                    if (p.foldingStatus !== FoldingStatus.FOLDED) {
                        return [];
                    }
                }
            }

            const r = [];
            for (const [conflictId, targetId] of folding.entries()) {
                r.push({
                    target: result.getPlace(targetId)!,
                    conflict: po.getPlace(conflictId)!
                });
            }
            return r;
        } else {
            // the conflict cannot be resolved => add conflict to the folded net
            conflict.foldingStatus = FoldingStatus.CONFLICT;
            return [{conflict, target}];
        }
    }

    private attemptEventFolding(following: Transition, folded: Transition): Map<string, string> | undefined {
        if (folded.outgoingArcs.length !== following.outgoingArcs.length) {
            return undefined;
        }

        const mapping = new Map<string, string>();
        const mapped = new Set<string>();

        const unmapped = following.outgoingArcs.map(a => a.destination as Place);

        while (unmapped.length > 0) {
            const p = unmapped.shift()!;

            if (p.outgoingArcs.length === 0) {
                if (unmapped.length !== 0) {
                    unmapped.push(p);
                    continue;
                } else {
                    for (const af of folded.outgoingArcs) {
                        const pf = af.destination as Place;
                        if (mapped.has(pf.id!)) {
                            continue;
                        }
                        mapping.set(p.id!, pf.id!);
                        break;
                    }
                    break;
                }
            }

            const followLabel = (p.outgoingArcs[0].destination as Transition).label;

            mappingFor:
                for (const af of folded.outgoingArcs) {
                    const pf = af.destination as Place;
                    if (mapped.has(pf.id!)) {
                        continue;
                    }

                    for (const ap of pf.outgoingArcs) {
                        if ((ap.destination as Transition).label === followLabel) {
                            mapping.set(p.id!, pf.id!);
                            mapped.add(pf.id!);
                            break mappingFor;
                        }
                    }
                }

            if (!mapping.has(p.id!)) {
                return undefined;
            }
        }

        return mapping;
    }

    private addConflict(problem: ConflictingPlace, folded: PetriNet): Array<ConflictingPlace> {
        if (problem.conflict.outgoingArcs.length === 0) {
            return [];
        }

        const original = problem.conflict.outgoingArcs[0].destination as Transition;

        let following = original.foldedPair;
        if (following === undefined) {
            following = new Transition(original.label);
            folded.addTransition(following);
        }

        folded.addArc(problem.target, following);

        if (original.foldedPair === undefined) {
            const newConflicts: Array<ConflictingPlace> = [];
            for (const out of original.outgoingArcs) {
                const p = new Place();
                folded.addPlace(p);
                folded.addArc(following, p);
                newConflicts.push({conflict: out.destination as Place, target: p});
            }

            original.foldedPair = following;
            return newConflicts;
        }
        return [];
    }
}
