import {Lifecycle} from '../../models/log/model/lifecycle';
import {Trace} from '../../models/log/model/trace';
import {LogEvent} from '../../models/log/model/logEvent';


export function createMockTrace(events: Array<{ n: string, p: Lifecycle }>): Trace {
    const trace = new Trace();
    for (const e of events) {
        const event = new LogEvent(e.n);
        event.lifecycle = e.p;
        trace.events.push(event);
    }
    return trace;
}
