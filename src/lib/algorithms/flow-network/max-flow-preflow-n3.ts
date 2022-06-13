export class MaxFlowPreflowN3 {
    private readonly n: number;
    private readonly cap: Array<Array<number>>;

    constructor(n: number) {
        this.n = n;
        this.cap = [];
        for (let i = 0; i < n; i++) {
            this.cap.push(new Array<number>(n).fill(0));
        }
    }

    public setCap(i: number, j: number, cap: number) {
        this.cap[i][j] = cap;
    }

    public setUnbounded(i: number, j: number) {
        this.setCap(i, j, 20000);
    }

    public getCap(i: number, j: number): number {
        return this.cap[i][j];
    }

    public maxFlow(s: number, t: number): number {
        const h = new Array<number>(this.n).fill(0);
        h[s] = this.n - 1;

        const maxh = new Array<number>(this.n).fill(0);
        const f: Array<Array<number>> = [];
        for (let i = 0; i < this.n; i++) {
            f.push(new Array<number>(this.n).fill(0));
        }
        const e = new Array<number>(this.n).fill(0);

        for (let i = 0; i < this.n; i++) {
            f[s][i] = this.cap[s][i];
            f[i][s] = -f[s][i];
            e[i] = this.cap[s][i];
        }

        for (let sz = 0; ;) {
            if (sz === 0) {
                for (let i = 0; i < this.n; i++) {
                    if (i !== s && i !== t && e[i] > 0) {
                        if (sz !== 0 && h[i] > h[maxh[0]]) {
                            sz = 0;
                        }
                        maxh[sz++] = i;
                    }
                }
            }
            if (sz === 0) {
                break;
            }
            while (sz !== 0) {
                let i = maxh[sz - 1];
                let pushed = false;
                for (let j = 0; j < this.n && e[i] !== 0; j++) {
                    if (h[i] === h[j] + 1 && this.cap[i][j] - f[i][j] > 0) {
                        const df = Math.min(this.cap[i][j] - f[i][j], e[i]);
                        f[i][j] += df;
                        f[j][i] -= df;
                        e[i] -= df;
                        e[j] += df;
                        if (e[i] === 0) {
                            sz--;
                        }
                        pushed = true;
                    }
                }
                if (!pushed) {
                    h[i] = 20000;
                    for (let j = 0; j < this.n; j++) {
                        if (h[i] > h[j] + 1 && this.cap[i][j] - f[i][j] > 0) {
                            h[i] = h[j] + 1;
                        }
                    }
                    if (h[i] > h[maxh[0]]) {
                        sz = 0;
                        break;
                    }
                }
            }
        }

        let flow = 0;
        for (let i = 0; i < this.n; i++) {
            flow += f[s][i];
        }

        return flow;
    }
}
