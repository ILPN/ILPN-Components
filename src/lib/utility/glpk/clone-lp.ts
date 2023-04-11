import {LP} from 'glpk.js';


interface Vars {
    name: string,
    coef: number
}

export function cloneLP(lp: LP): LP {
    const clone: LP = {
        name: lp.name,
        objective: {
            direction: lp.objective.direction,
            name: lp.objective.name,
            vars: cloneVars(lp.objective.vars)
        },
        subjectTo: (lp.subjectTo.map(st => ({
            name: st.name,
            vars: cloneVars(st.vars),
            bnds: {
                type: st.bnds.type,
                ub: st.bnds.ub,
                lb: st.bnds.lb
            }
        }))),
    };

    if (lp.binaries !== undefined) {
        clone.binaries = lp.binaries.map(s => s);
    }
    if (lp.generals !== undefined) {
        clone.generals = lp.generals.map(s => s);
    }

    return clone;
}

function cloneVars(vars: Array<Vars>): Array<Vars> {
    return vars.map(v => ({name: v.name, coef: v.coef}));
}
