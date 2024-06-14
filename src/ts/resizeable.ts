import style from "../../dist/css/resizeable.css";
import { HTMLBaseElement } from "./base.js";

export class ResizeablePanel extends HTMLBaseElement {
  // TODO
  static observedAttributes = ["orientation"];

  _first: boolean = true;
  childElements: HTMLElement[];
  childSizes: { height: number; width: number }[];
  size: DOMRect;

  orientation: "TB" | "BT" | "LR" | "RL" = "LR";
  layout: "H" | "V" = "H";
  reversed: boolean = false;

  extraSpace: number = 0;

  constructor() {
    super();
    this.childElements = [];
    this.childSizes = [];
  }

  connectedCallback(): void {
    const shadow = this.attachShadow({ mode: "open" });
    const styleElem = document.createElement("style");
    styleElem.textContent = style;
    shadow.appendChild(styleElem);
    shadow.appendChild(document.createElement("slot"));
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
    switch ((this.getAttribute("orientation") || "").toLowerCase()) {
      case "tb":
        this.orientation = "TB";
        this.layout = "V";
        this.reversed = false;
        break;
      case "vertical":
        this.orientation = "TB";
        this.layout = "V";
        this.reversed = false;
        break;
      case "bt":
        this.orientation = "BT";
        this.layout = "V";
        this.reversed = true;
        break;
      case "reverse-vertical":
        this.orientation = "BT";
        this.layout = "V";
        this.reversed = true;
        break;
      case "lr":
        this.orientation = "LR";
        this.layout = "H";
        this.reversed = false;
        break;
      case "horizontal":
        this.orientation = "LR";
        this.layout = "H";
        this.reversed = false;
        break;
      case "rl":
        this.orientation = "RL";
        this.layout = "H";
        this.reversed = true;
        break;
      case "reverse-horizontal":
        this.orientation = "RL";
        this.layout = "H";
        this.reversed = true;
        break;
      default:
        this.orientation = "LR";
        this.layout = "H";
        this.reversed = false;
    }
  }

  collectChildren(): void {
    Array.from(this.children).forEach((element) => {
      this.childElements.push(element as HTMLElement);
    });
  }

  _calcHeightWidth(dims) {
    let height: number;
    let width: number;

    if (this.layout === "H") {
      height = dims?.height || 0;
      width = Math.max(
        (dims?.width || 0 - this.extraSpace) / this.childElements.length,
        0,
      );
    } else {
      height = Math.max(
        (dims?.height || 0 - this.extraSpace) / this.childElements.length,
        0,
      );
      width = dims?.width || 0;
    }
    return { height, width };
  }

  initialdraw(): void {
    // paint children
    const dims = this.getBoundingClientRect();
    const { height, width } = this._calcHeightWidth(dims);

    switch (this.orientation) {
      case "RL":
        this.style.flexDirection = "row-reverse";
        break;
      case "TB":
        this.style.flexDirection = "column";
        break;
      case "BT":
        this.style.flexDirection = "column-reverse";
        break;
      default:
        this.style.flexDirection = "row";
    }

    this.childElements.forEach((element: HTMLElement, index: number): void => {
      this.childSizes[index] = { height, width };
      element.style.height = `${this.childSizes[index].height}px`;
      element.style.width = `${this.childSizes[index].width}px`;
      element.style.flexGrow = "1";
      if (!element.style.overflow) {
        element.style.overflow = "hidden";
      }
    });

    this.size = dims;
    this.parsed = true;
  }

  scaledraw(): void {
    // scale sizes by change
    const newDims = this.getBoundingClientRect();
    const { height: heightDiff, width: widthDiff } = this._calcHeightWidth({
      height: newDims.height - this.size.height,
      width: newDims.width - this.size.width,
    });

    this.childElements.forEach((element: HTMLElement, index: number): void => {
      this.childSizes[index] = {
        height: element.offsetHeight + heightDiff,
        width: element.offsetWidth + widthDiff,
      };
      element.style.height = `${this.childSizes[index].height}px`;
      element.style.width = `${this.childSizes[index].width}px`;
    });

    // update with new size
    this.size = newDims;
  }

  draw(): void {
    if (this._first) {
      this.initialdraw();
      this._first = false;
    } else {
      this.scaledraw();
    }
  }
}
