export interface FileDisplay {
    icon: string;
    color: string;
    bold?: boolean;
}

export const FD_PETRI_NET: FileDisplay = {
    icon: '♥',
    color: 'red'
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
    color: 'black'
}

export const FD_CONCURRENCY: FileDisplay = {
    icon: '┃┃',
    color: 'blue',
    bold: true
}
