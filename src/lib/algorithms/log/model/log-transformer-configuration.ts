export interface LogTransformerConfiguration {
    /**
     * when `true` keeps only events without a set lifecycle attribute or with lifecycle attribute set to complete
     */
    cleanLog?: boolean;
    /**
     * when `true` adds a new start and stop event to each trace. The events are labeled with the `LogSymbol` constants.
     */
    addStartStopEvent?: boolean;
    /**
     * when `true` discards traces that are prefixes of other traces.
     * If the `addStartStopEvent` option is also set, traces are compared before the new events are added.
     */
    discardPrefixes?: boolean;
}

/**
 * @deprecated
 * use `LogTransformerConfiguration` instead.
 */
export type LogToPartialOrderTransformerConfiguration = LogTransformerConfiguration;
