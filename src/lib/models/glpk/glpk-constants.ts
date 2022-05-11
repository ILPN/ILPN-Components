/**
 * All constants copied from the `glpk.js` library for better usability
 */

export enum Goal {
    /**
     * GLP_MIN
     */
    MINIMUM = 1,
    /**
     * GLP_MAX
     */
    MAXIMUM = 2,
}

export enum Constraint {
    /**
     * GLP_FR
     */
    FREE_VARIABLE = 1,
    /**
     * GLP_LO
     */
    LOWER_BOUND = 2,
    /**
     * GLP_UP
     */
    UPPER_BOUND = 3,
    /**
     * GLP_DB
     */
    DOUBLE_BOUND = 4,
    /**
     * GLP_FX
     */
    FIXED_VARIABLE = 5,
}

export enum MessageLevel {
    /**
     * GLP_MSG_OFF
     */
    OFF = 0,
    /**
     * GLP_MSG_ERR
     */
    ERROR = 1,
    /**
     * GLP_MSG_ON
     */
    STANDARD = 2,
    /**
     * GLP_MSG_ALL
     */
    ALL = 3,
    /**
     * GLP_MSG_DBG
     */
    DEBUG = 4
}

export enum Solution {
    /**
     * GLP_UNDEF
     */
    UNDEFINED = 1,
    /**
     * GLP_FEAS
     */
    FEASIBLE = 2,
    /**
     * GLP_INFEAS
     */
    INFEASIBLE = 3,
    /**
     * GLP_NOFEAS
     */
    NO_SOLUTION = 4,
    /**
     * GLP_OPT
     */
    OPTIMAL = 5,
    /**
     * GLP_UNBND
     */
    UNBOUNDED = 6
}
