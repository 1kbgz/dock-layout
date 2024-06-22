import style from '../../dist/css/resizeable.css';
import { HTMLBaseElement } from './base.js';

export class ResizeablePanel extends HTMLBaseElement {
    // TODO
    static observedAttributes = ['orientation'];

    _first: boolean = true;
    childElements: HTMLElement[];
    childSizes: { height: number; width: number }[];

    orientation: 'TB' | 'BT' | 'LR' | 'RL' = 'LR';
    layout: 'H' | 'V' = 'H';
    reversed: boolean = false;

    extraSpace: number = 0;

    constructor() {
        super();
        this.childElements = [];
        this.childSizes = [];
    }

    connectedCallback(): void {
        const shadow = this.attachShadow({ mode: 'open' });
        const styleElem = document.createElement('style');
        styleElem.textContent = style;
        shadow.appendChild(styleElem);
        shadow.appendChild(document.createElement('slot'));
        super.setup();
    }

    childrenAvailableCallback(): void {
        this.collectChildren();
        this.setupAttributes();
        // attach resize observer to parent
        const resizeObserver = new ResizeObserver((entries) => this.draw());
        resizeObserver.observe(this as Element);
        this.draw();
    }

    setupAttributes(): void {
        switch ((this.getAttribute('orientation') || '').toLowerCase()) {
            case 'tb':
                this.orientation = 'TB';
                this.layout = 'V';
                this.reversed = false;
                break;
            case 'vertical':
                this.orientation = 'TB';
                this.layout = 'V';
                this.reversed = false;
                break;
            case 'bt':
                this.orientation = 'BT';
                this.layout = 'V';
                this.reversed = true;
                break;
            case 'reverse-vertical':
                this.orientation = 'BT';
                this.layout = 'V';
                this.reversed = true;
                break;
            case 'lr':
                this.orientation = 'LR';
                this.layout = 'H';
                this.reversed = false;
                break;
            case 'horizontal':
                this.orientation = 'LR';
                this.layout = 'H';
                this.reversed = false;
                break;
            case 'rl':
                this.orientation = 'RL';
                this.layout = 'H';
                this.reversed = true;
                break;
            case 'reverse-horizontal':
                this.orientation = 'RL';
                this.layout = 'H';
                this.reversed = true;
                break;
            default:
                this.orientation = 'LR';
                this.layout = 'H';
                this.reversed = false;
        }
    }

    collectChildren(): void {
        Array.from(this.children).forEach((element) => {
            this.childElements.push(element as HTMLElement);
        });
    }

    _calcSizeFromChildren(): number {
        let size = this.extraSpace;
        this.childElements.forEach((element: HTMLElement): void => {
            const rect = element.getBoundingClientRect();
            if (this.layout === 'V') {
                size += rect.height;
            } else {
                size += rect.width;
            }
        });
        return size;
    }

    _calcHeightWidth(dims: { height: number; width: number }, includeExtra: boolean = false) {
        let height: number = 0;
        let width: number = 0;
        const extra = includeExtra ? this.extraSpace : 0;

        if (this.childElements.length !== 0) {
            if (this.layout === 'H') {
                height = dims?.height;
                width = (dims?.width - extra) / this.childElements.length;
            } else {
                height = (dims?.height - extra) / this.childElements.length;
                width = dims?.width;
            }
        }
        return { height, width };
    }

    initialdraw(): void {
        // paint children
        const dims = this.getBoundingClientRect();
        let originalHeight = dims.height;
        let originalWidth = dims.width;
        if (this.layout === 'H') {
            originalWidth -= this.extraSpace;
        } else {
            originalHeight -= this.extraSpace;
        }
        const { height, width } = this._calcHeightWidth({ height: originalHeight, width: originalWidth });

        switch (this.orientation) {
            case 'RL':
                this.style.flexDirection = 'row-reverse';
                break;
            case 'TB':
                this.style.flexDirection = 'column';
                break;
            case 'BT':
                this.style.flexDirection = 'column-reverse';
                break;
            default:
                this.style.flexDirection = 'row';
        }

        this.childElements.forEach((element: HTMLElement, index: number): void => {
            this.childSizes[index] = { height, width };
            element.style.height = `${this.childSizes[index].height}px`;
            element.style.width = `${this.childSizes[index].width}px`;
            // if (!element.style.overflow) {
            //     element.style.overflow = 'hidden';
            // }
        });

        this.parsed = true;
    }

    updateSizes(indexes: number[], sizes: number[]): void {
        indexes.forEach((index, index_in_sizes) => {
            const size: number = sizes[index_in_sizes];
            if (this.layout === 'H') {
                this.childSizes[index].width = size;
            } else {
                this.childSizes[index].height = size;
            }
        });
        this.scaledraw(indexes);
    }

    scaledraw(only: number[] = []): void {
        // scale sizes by change
        const sizeFromChildren = this._calcSizeFromChildren();
        const newDims = this.getBoundingClientRect();
        const onlyChangeIndexes = only !== undefined ? only : [];

        // calculate change in heights/width overall,
        // to spread across child elements
        const { height: heightDiff, width: widthDiff } = this._calcHeightWidth({
            height: this.layout === 'V' ? newDims.height - sizeFromChildren : newDims.height,
            width: this.layout === 'H' ? newDims.width - sizeFromChildren : newDims.width,
        });

        // update elements accordingly
        this.childElements.forEach((element: HTMLElement, index: number): void => {
            if (onlyChangeIndexes.length > 0 && onlyChangeIndexes.indexOf(index) < 0) {
                // skip if locked
                return;
            }
            this.childSizes[index] = {
                height: this.layout === 'V' ? this.childSizes[index].height + heightDiff : heightDiff,
                width: this.layout === 'H' ? this.childSizes[index].width + widthDiff : widthDiff,
            };
            element.style.height = `${this.childSizes[index].height}px`;
            element.style.width = `${this.childSizes[index].width}px`;
        });

        // reset stored heights and widths to actual after laying out
        this.childElements.forEach((element: HTMLElement, index: number): void => {
            if (onlyChangeIndexes.length > 0 && onlyChangeIndexes.indexOf(index) < 0) {
                // skip if locked
                return;
            }
            const rect = element.getBoundingClientRect();
            this.childSizes[index] = {
                height: rect.height,
                width: rect.width,
            };
        });
    }

    draw(): void {
        if (this._first) {
            this.initialdraw();
            this.scaledraw();
            this._first = false;
        } else {
            this.scaledraw();
        }
    }
}
