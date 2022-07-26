import {Trace} from '../../models/log/model/trace';
import {Lifecycle} from '../../models/log/model/lifecycle';

export abstract class LogCleaner {
    protected cleanLog(log: Array<Trace>): Array<Trace> {
        return log.map(t => this.cleanTrace(t));
    }

    protected cleanTrace(trace: Trace): Trace {
        const result = new Trace();
        result.name = trace.name;
        result.description = trace.description;
        result.events = trace.events.filter(e => e.lifecycle === undefined || e.lifecycle === Lifecycle.COMPLETE);
        return result;
    }
}
