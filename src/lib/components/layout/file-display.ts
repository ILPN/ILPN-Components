export interface FileDisplay {
    icon: string;
    color?: string;
    bold?: boolean;
    fontFamily?: string;
    /**
     * a multiplier of the symbol text's default font size in a small square
     */
    fontSizeMultiplierSmall?: number;
    /**
     * a multiplier of the symbol text's default font size in a large square
     */
    fontSizeMultiplierLarge?: number;
    /**
     * the amount of pixels added to or subtracted from the symbol text's top position in a small square
     */
    topOffsetSmall?: number;
    /**
     * the amount of pixels added to or subtracted from the symbol text's top position in a large square
     */
    topOffsetLarge?: number;
}

export const FD_PETRI_NET: FileDisplay = {
    icon: '♥',
    color: 'red'
};

export const FD_PETRI_NET_SPEC: FileDisplay = {
    icon: '♥',
    color: 'black'
};

export const FD_BPMN: FileDisplay = {
    icon: '♦',
    color: 'red'
};

export const FD_PARTIAL_ORDER: FileDisplay = {
    icon: '♠',
    color: 'black'
}

export const FD_TRANSITION_SYSTEM: FileDisplay = {
    icon: '♣',
    color: 'black'
};

export const FD_LOG: FileDisplay = {
    icon: '★',
    color: 'black',
    fontSizeMultiplierLarge: 0.7,
    topOffsetSmall: -2
}

export const FD_CONCURRENCY: FileDisplay = {
    icon: '┃┃',
    color: 'blue',
    bold: true
}
