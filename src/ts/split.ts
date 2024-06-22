import style from '../../dist/css/split-divider.css';
import { createIfNotDefined } from './base.js';
import { ResizeablePanel } from './resizeable.js';

class SplitDivider extends HTMLElement {
    getBeforeElementSize: () => number;
    getAfterElementSize: () => number;
    updateSizes: (a: number, b: number) => void;
    parentLayout: SplitPanel;
    div: HTMLDivElement;

    connectedCallback(): void {
        const shadow = this.attachShadow({ mode: 'open' });
        const styleElem = document.createElement('style');
        styleElem.textContent = style;
        shadow.appendChild(styleElem);

        this.div = document.createElement('div');
        shadow.appendChild(this.div);
    }

    setup(): void {
        let lastpos: number | null = null;
        let lastonmouseup: any = null;
        let lastonmousemove: any = null;

        const onmousemove = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const rect = this.div.getBoundingClientRect();
            if (this.parentLayout.layout === 'H') {
                lastpos = (rect.left + rect.right) / 2;
            } else {
                lastpos = (rect.top + rect.bottom) / 2;
            }

            let moveBefore: number;
            let moveAfter: number;

            if (this.parentLayout.layout === 'H') {
                moveBefore = ev.pageX - lastpos;
                moveAfter = lastpos - ev.pageX;
            } else {
                moveBefore = ev.pageY - lastpos;
                moveAfter = lastpos - ev.pageY;
            }

            if (Math.abs(moveBefore) < 3) {
                // a good balance of useability without doing too much work
                return;
            }

            if (this.parentLayout.layout === 'H') {
                let newbeforeWidth = this.getBeforeElementSize() + moveBefore;
                let newafterWidth = this.getAfterElementSize() + moveAfter;

                if (newbeforeWidth < 0) {
                    newafterWidth += newbeforeWidth;
                    newbeforeWidth = 0;
                }
                if (newafterWidth < 0) {
                    newbeforeWidth += newafterWidth;
                    newafterWidth = 0;
                }

                this.updateSizes(newbeforeWidth, newafterWidth);
            } else {
                let newbeforeHeight = this.getBeforeElementSize() + moveBefore;
                let newafterHeight = this.getAfterElementSize() + moveAfter;

                if (newbeforeHeight < 0) {
                    newafterHeight += newbeforeHeight;
                    newbeforeHeight = 0;
                }
                if (newafterHeight < 0) {
                    newbeforeHeight += newafterHeight;
                    newafterHeight = 0;
                }
                this.updateSizes(newbeforeHeight, newafterHeight);
            }
        };

        this.div.addEventListener('mousedown', (ev: DragEvent) => {
            ev.preventDefault();
            if (this.parentLayout.layout === 'H') {
                lastpos = ev.clientX;
            } else {
                lastpos = ev.clientY;
            }
            lastonmouseup = document.onmouseup;
            lastonmousemove = document.onmousemove;
            document.onmousemove = onmousemove;
            document.onmouseup = () => {
                document.onmouseup = lastonmouseup;
                document.onmousemove = lastonmousemove;
            };
        });
    }
}

createIfNotDefined('tkp-split-panel-divider', SplitDivider);

export class SplitPanel extends ResizeablePanel {
    dividers: HTMLElement[];
    dividerSize: number = 4;

    constructor() {
        super();
        this.dividers = [];
    }

    childrenAvailableCallback(): void {
        // NOTE: use `this.children` here as the nodes
        // are not yet attacheds
        this.extraSpace = this.dividerSize * (this.children.length - 1);
        super.childrenAvailableCallback();

        // iterate through children and insert draggable resizeable dividers
        this.childElements.forEach((elem: HTMLElement, index: number) => {
            if (index === this.childElements.length - 1) return;

            // add a divider
            const divider = document.createElement('tkp-split-panel-divider');

            if (this.layout === 'H') {
                if (this.reversed) {
                    (divider as SplitDivider).getBeforeElementSize = () => this.childSizes[index + 1].width;
                    (divider as SplitDivider).getAfterElementSize = () => this.childSizes[index].width;
                    (divider as SplitDivider).updateSizes = (a: number, b: number) => this.updateSizes([index + 1, index], [a, b]);
                } else {
                    (divider as SplitDivider).getBeforeElementSize = () => this.childSizes[index].width;
                    (divider as SplitDivider).getAfterElementSize = () => this.childSizes[index + 1].width;
                    (divider as SplitDivider).updateSizes = (a: number, b: number) => this.updateSizes([index, index + 1], [a, b]);
                }
            } else {
                if (this.reversed) {
                    (divider as SplitDivider).getBeforeElementSize = () => this.childSizes[index + 1].height;
                    (divider as SplitDivider).getAfterElementSize = () => this.childSizes[index].height;
                    (divider as SplitDivider).updateSizes = (a: number, b: number) => this.updateSizes([index + 1, index], [a, b]);
                } else {
                    (divider as SplitDivider).getBeforeElementSize = () => this.childSizes[index].height;
                    (divider as SplitDivider).getAfterElementSize = () => this.childSizes[index + 1].height;
                    (divider as SplitDivider).updateSizes = (a: number, b: number) => this.updateSizes([index, index + 1], [a, b]);
                }
            }
            (divider as SplitDivider).parentLayout = this;
            this.dividers.push(divider);

            // append to dom
            elem.insertAdjacentElement('afterend', divider);
            divider.setup();
        });
    }

    draw(): void {
        // draw dividers
        const dims = this.getBoundingClientRect();
        this.dividers.forEach((divider: SplitDivider) => {
            if (this.layout === 'H') {
                divider.style.height = `${dims?.height}px`;
                divider.style.width = `${this.dividerSize}px`;
                divider.div.style.height = `${dims?.height}px`;
                divider.div.style.width = `${this.dividerSize}px`;
            } else {
                divider.style.height = `${this.dividerSize}px`;
                divider.style.width = `${dims?.width}px`;
                divider.div.style.height = `${this.dividerSize}px`;
                divider.div.style.width = `${dims?.width}px`;
            }
        });
        super.draw();
    }
}
