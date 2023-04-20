import {SvgWrapper} from './svg-wrapper';
import {Place} from '../../../models/pn/model/place';
import {PLACE_STYLE} from '../internals/constants/place-style';
import {Observable, Subject, Subscription} from 'rxjs';
import {TOKEN_STYLE} from '../internals/constants/token-style';


export class SvgPlace extends SvgWrapper {

    private readonly _clicked$: Subject<string>;
    private readonly _placeSubs: Array<Subscription>;

    private readonly _markingTextEl: SVGElement;
    private readonly _markingTokenEls: Array<SVGElement>;

    constructor(place: Place) {
        super(place.id);

        const placeEl = this.createSvgElement('circle');
        this.applyStyle(placeEl, PLACE_STYLE);
        placeEl.classList.add('draggable');
        this.registerMainElement(placeEl);
        this._clicked$ = new Subject<string>();
        this._mainElement!.onclick = (_) => {
            this.processMouseClick();
        };

        const textEl = this.createTextElement(place.id!);
        this._placeSubs = [
            this.center$.subscribe(c => {
                textEl.setAttribute('x', `${c.x}`);
                textEl.setAttribute('y', `${c.y + parseInt(PLACE_STYLE.r) + this.TEXT_OFFSET}`);
            })
        ];
        this._elements.unshift(textEl);

        // text for marking > 9
        this._markingTextEl = this.createTextElement();
        this._placeSubs.push(
            this.center$.subscribe(c => {
                this._markingTextEl.setAttribute('x', `${c.x}`);
                this._markingTextEl.setAttribute('y', `${c.y}`);
            })
        );
        this._markingTextEl.setAttribute('font-size', '1.5em');
        this._elements.unshift(this._markingTextEl);

        // circle tokes
        this._markingTokenEls = [];
        for (const offset of [{x: -1, y: 1}, {x: -1, y: -1}, {x: -1, y: 0}, {x: 0, y: -1}]) {
            for (const flip of [1, -1]) {
                this.createTokenSvg(11 * offset.x * flip, 11 * offset.y * flip);
            }
        }
        this.createTokenSvg(0,0);

        this.updateMarking(place.marking);
    }

    override destroy() {
        super.destroy();
        this._placeSubs.forEach(s => s.unsubscribe());
        this._clicked$.complete();
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }

    public get clicked$(): Observable<string> {
        return this._clicked$.asObservable();
    }

    private createTokenSvg(cxDelta: number, cyDelta: number) {
        const token = this.createSvgElement('circle');
        this.applyStyle(token, TOKEN_STYLE);
        this._markingTokenEls.push(token);
        this._placeSubs.push(
            this.center$.subscribe(c => {
                token.setAttribute('cx', `${c.x + cxDelta}`);
                token.setAttribute('cy', `${c.y + cyDelta}`);
            })
        );
        this._elements.unshift(token);
    }

    public fill(color: string | undefined) {
        if (color !== undefined) {
            this._mainElement?.setAttribute('fill-opacity', '1');
            this._mainElement?.setAttribute('fill', color);
        } else {
            this._mainElement?.setAttribute('fill-opacity', '0');
        }
    }

    private processMouseClick() {
        this._clicked$.next(this.getId());
    }

    public updateMarking(tokens: number) {
        this._markingTextEl.textContent = tokens < 10 ? '' : `${tokens}`;
        this.resolveMarkingVisibility(tokens);
    }

    private resolveMarkingVisibility(tokens: number) {
        this._markingTokenEls.forEach(el => {
            el.setAttribute('fill-opacity', '0');
        });
        if (tokens === 0 || tokens > 9) {
            return;
        }
        for (let i = 0; i < (tokens - 1) / 2; i++) {
            this._markingTokenEls[2 * i].setAttribute('fill-opacity', '1');
            this._markingTokenEls[2 * i + 1].setAttribute('fill-opacity', '1');
        }
        if (tokens % 2 === 1) {
            this._markingTokenEls[8].setAttribute('fill-opacity', '1');
        }
    }
}
