import {SvgWrapper} from './svg-wrapper';
import {Place} from '../../../../../models/pn/model/place';
import {PLACE_STYLE} from '../../constants/place-style';
import {Subscription} from 'rxjs';

export class SvgPlace extends SvgWrapper {

    private readonly _placeSubs: Array<Subscription>;

    constructor(place: Place) {
        super(place.id);

        const placeEl = this.createSvgElement('circle');
        this.applyStyle(placeEl, PLACE_STYLE);
        this.registerMainElement(placeEl);

        const textEl = this.createTextElement(place.id!);
        this._placeSubs = [
            this.center$.subscribe(c => {
                textEl.setAttribute('x', `${c.x}`);
                textEl.setAttribute('y', `${c.y + parseInt(PLACE_STYLE.r) + this.TEXT_OFFSET}`);
            })
        ];
        this._elements.push(textEl);

        if (place.marking > 0) {
            // TODO circle tokens
            // TODO dynamic marking
            const markingEl = this.createTextElement(`${place.marking}`);
            this._placeSubs.push(
                this.center$.subscribe(c => {
                    markingEl.setAttribute('x', `${c.x}`);
                    markingEl.setAttribute('y', `${c.y}`);
                })
            );
            markingEl.setAttribute('font-size', '1.5em');
            this._elements.push(markingEl);
        }
    }

    override destroy() {
        super.destroy();
        this._placeSubs.forEach(s => s.unsubscribe());
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }
}
