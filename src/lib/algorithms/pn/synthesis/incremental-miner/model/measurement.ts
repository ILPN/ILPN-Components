export class Measurement {
    constructor(public trace: number,
                public totalPlaces: number,
                public reducedPlaces: number,
                public time: number,
                public regions: boolean,
                public discarded: number) {
    }
}
