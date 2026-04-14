import {Component, Input} from '@angular/core';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-symbol-square',
    templateUrl: './symbol-square.component.html',
    styleUrls: ['./symbol-square.component.scss']
})
export class SymbolSquareComponent {

    @Input() bold: boolean | undefined = false;
    @Input() squareContent: string | undefined;
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() hover: boolean = false;
    @Input() disabled: boolean = false;

    @Input() set large(value: string | boolean) {
        if (typeof value === 'boolean') {
            this.isLarge = value;
        } else {
            // valueless attribute is passed as an empty string
            this.isLarge = value === '' || value === 'true'
        }
    }

    public isLarge = false;

    resolveSquareContent(): string {
        return (this.fileDisplay?.icon ?? this.squareContent) ?? '?';
    }

    resolveSquareColor(): string {
        if (this.disabled) {
            return 'grey';
        }
        return this.fileDisplay?.color ?? 'black';
    }

    resolveFontWeight(): string {
        let isBold;
        if (this.fileDisplay !== undefined) {
            isBold = this.fileDisplay.bold;

        } else {
            isBold = this.bold;
        }
        return isBold ? 'bold' : 'normal';
    }

    resolveFontFamily(): string {
        return this.fileDisplay?.fontFamily ?? `'Courier New', emoji, 'Symbola', 'BabelStonePseudographica', monospace, serif`;
    }

    resolveFontSize(): string {
        let fontSize = this.isLarge ? 50 : 30;
        const multiplier = (this.isLarge ? this.fileDisplay?.fontSizeMultiplierLarge : this.fileDisplay?.fontSizeMultiplierSmall) ?? 1;

        if (multiplier) {
            fontSize = Math.floor(fontSize * multiplier);
        }
        return `${fontSize}px`;
    }

    resolveTopOffset(): string {
        const offset = (this.isLarge ? this.fileDisplay?.topOffsetLarge : this.fileDisplay?.topOffsetSmall) ?? 0;
        return `${offset}px`;
    }
}
