import style from "../../dist/css/split-divider.css";
import { createIfNotDefined } from "./base.js";
import { ResizeablePanel } from "./resizeable.js";

class SplitDivider extends HTMLElement {
  beforeElement: HTMLElement;
  afterElement: HTMLElement;
  parentLayout: SplitPanel;
  div: HTMLDivElement;

  connectedCallback(): void {
    const shadow = this.attachShadow({ mode: "open" });
    const styleElem = document.createElement("style");
    styleElem.textContent = style;
    shadow.appendChild(styleElem);

    this.div = document.createElement("div");
    shadow.appendChild(this.div);
  }

  setup(): void {
    let lastpos: number | null = null;
    let lastonmouseup: any = null;
    let lastonmousemove: any = null;

    if (this.parentElement.reversed) {
      const temp = this.beforeElement;
      this.beforeElement = this.afterElement;
      this.afterElement = temp;
    }

    const onmousemove = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const rect = this.div.getBoundingClientRect();
      if (this.parentLayout.layout === "H") {
        lastpos = (rect.left + rect.right) / 2;
      } else {
        lastpos = (rect.top + rect.bottom) / 2;
      }

      let moveBefore: number;
      let moveAfter: number;

      if (this.parentLayout.layout === "H") {
        moveBefore = ev.pageX - lastpos;
        moveAfter = lastpos - ev.pageX;
      } else {
        moveBefore = ev.pageY - lastpos;
        moveAfter = lastpos - ev.pageY;
      }

      if (this.parentLayout.layout === "H") {
        let newbeforeWidth = this.beforeElement.offsetWidth + moveBefore;
        let newafterWidth = this.afterElement.offsetWidth + moveAfter;

        if (newbeforeWidth < 0) {
          newafterWidth += newbeforeWidth;
          newbeforeWidth = 0;
        }
        if (newafterWidth < 0) {
          newbeforeWidth += newafterWidth;
          newafterWidth = 0;
        }

        this.beforeElement.style.width = `${newbeforeWidth}px`;
        this.afterElement.style.width = `${newafterWidth}px`;
      } else {
        let newbeforeHeight = this.beforeElement.offsetHeight + moveBefore;
        let newafterHeight = this.afterElement.offsetHeight + moveAfter;

        if (newbeforeHeight < 0) {
          newafterHeight += newbeforeHeight;
          newbeforeHeight = 0;
        }
        if (newafterHeight < 0) {
          newbeforeHeight += newafterHeight;
          newafterHeight = 0;
        }
        this.beforeElement.style.height = `${newbeforeHeight}px`;
        this.afterElement.style.height = `${newafterHeight}px`;
      }
    };

    this.div.addEventListener("mousedown", (ev: DragEvent) => {
      ev.preventDefault();
      if (this.parentLayout.layout === "H") {
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

createIfNotDefined("tkp-split-panel-divider", SplitDivider);

export class SplitPanel extends ResizeablePanel {
  dividers: HTMLElement[];

  constructor() {
    super();
    this.dividers = [];
  }

  childrenAvailableCallback(): void {
    this.extraSpace = 2 * (this.childElements.length - 1);
    super.childrenAvailableCallback();

    // iterate through children and insert draggable resizeable dividers
    this.childElements.forEach((elem: HTMLElement, index: number) => {
      if (index === this.childElements.length - 1) return;

      // add a divider
      const divider = document.createElement("tkp-split-panel-divider");

      (divider as SplitDivider).beforeElement = elem;
      (divider as SplitDivider).afterElement = this.childElements[index + 1];
      (divider as SplitDivider).parentLayout = this;
      this.dividers.push(divider);

      // append to dom
      elem.insertAdjacentElement("afterend", divider);
      divider.setup();
    });
  }

  draw(): void {
    // draw dividers
    const dims = this.getBoundingClientRect();
    this.dividers.forEach((divider: SplitDivider) => {
      if (this.layout === "H") {
        divider.div.style.height = `${dims?.height}px`;
        divider.div.style.width = "2px";
      } else {
        divider.div.style.height = "2px";
        divider.div.style.width = `${dims?.width}px`;
      }
    });

    // don't call resizeable draw
    super.draw();
  }
}
