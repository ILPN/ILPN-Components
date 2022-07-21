export abstract class Identifiable {
    private _id: string | undefined;

    protected constructor(id?: string) {
        this._id = id;
    }

    get id(): string | undefined {
        return this._id;
    }

    set id(value: string | undefined) {
        this._id = value;
    }

    public getId(): string {
        if (this._id === undefined) {
            throw new Error('id is undefined');
        }
        return this._id;
    }
}

export function getById<T extends Identifiable>(map: Map<string, T>, object: T | string): T | undefined {
    if (typeof object === 'string') {
        return map.get(object);
    } else {
        return map.get(object.getId());
    }
}
