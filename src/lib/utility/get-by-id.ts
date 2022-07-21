export interface Identifiable {
    id: string;
}

export function getById<T extends Identifiable>(map: Map<string, T>, object: T | string): T | undefined {
    if (typeof object === 'string') {
        return map.get(object);
    } else {
        return map.get(object.id);
    }
}
