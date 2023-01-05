import {SvgWrapper} from './svg-wrapper';
import {Place} from '../../../../../models/pn/model/place';
import {PLACE_STYLE} from '../../constants/place-style';
import {Observable, Subject, Subscription} from 'rxjs';


export class SvgPlace extends SvgWrapper {

    private readonly _clicked$: Subject<string>;
    private readonly _placeSubs: Array<Subscription>;

    private readonly _markingEl: SVGElement;

    constructor(place: Place) {
        super(place.id);

        const placeEl = this.createSvgElement('circle');
        this.applyStyle(placeEl, PLACE_STYLE);
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
        this._elements.push(textEl);

        // TODO circle tokens
        this._markingEl = this.createTextElement();
        this.updateMarking(place.marking);
        this._placeSubs.push(
            this.center$.subscribe(c => {
                this._markingEl.setAttribute('x', `${c.x}`);
                this._markingEl.setAttribute('y', `${c.y}`);
            })
        );
        this._markingEl.setAttribute('font-size', '1.5em');
        this._elements.push(this._markingEl);
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
        this._markingEl.textContent = tokens === 0 ? '' : `${tokens}`;
    }
}
