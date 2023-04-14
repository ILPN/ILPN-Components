import {SvgWrapper} from './svg-wrapper';
import {Transition} from '../../../models/pn/model/transition';
import {SILENT_TRANSITION_STYLE, TRANSITION_STYLE, TransitionStyle} from '../internals/constants/transition-style';
import {Subscription} from 'rxjs';
import {Point} from '../../../utility/svg/point';


export class SvgTransition extends SvgWrapper {

    private _transition: Transition;

    private readonly _textSub: Subscription;

    constructor(transition: Transition) {
        super(transition.id);
        this._transition = transition;

        const transEl = this.createSvgElement('rect');
        const style = this.resolveTransitionStyle();
        this.applyStyle(transEl, style);
        this.registerMainElement(transEl);

        if (transition.isSilent) {
            this._textSub = Subscription.EMPTY;
            return;
        }

        const textEl = this.createTextElement(transition.label as string);
        this._textSub = this.center$.subscribe(c => {
            textEl.setAttribute('x', `${c.x}`)
            textEl.setAttribute('y', `${c.y + parseInt(style.height) / 2 + this.TEXT_OFFSET}`);
        });
        this._elements.push(textEl);
    }

    override destroy() {
        super.destroy();
        this._textSub.unsubscribe();
    }

    protected override svgOffset(): Point {
        const style = this.resolveTransitionStyle();
        return {
            x: -parseInt(style.width) / 2,
            y: -parseInt(style.height) / 2,
        };
    }

    public resolveTransitionStyle(): TransitionStyle {
        return this.isSilent() ? SILENT_TRANSITION_STYLE : TRANSITION_STYLE;
    }

    public isSilent(): boolean {
        return this._transition.isSilent;
    }
}
