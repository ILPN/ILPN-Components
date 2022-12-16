import {Trace} from '../../models/log/model/trace';
import {Lifecycle} from '../../models/log/model/lifecycle';


export function cleanLog(log: Array<Trace>): Array<Trace> {
    return log.map(t => cleanTrace(t));
}

export function cleanTrace(trace: Trace): Trace {
    const result = new Trace();
    result.name = trace.name;
    result.description = trace.description;
    result.events = trace.events.filter(e => e.lifecycle === undefined || e.lifecycle.toLowerCase() === Lifecycle.COMPLETE);
    return result;
}
