export const createIfNotDefined = (
  name: string,
  element: CustomElementConstructor,
) => {
  if (document.createElement(name).constructor === HTMLElement) {
    window.customElements.define(name, element);
    console.log(`Registering custom element ${name}`);
  }
};

export class HTMLBaseElement extends HTMLElement {
  parsed: boolean;
  parentNodes: Node[];
  renderCompleteObserver: MutationObserver;

  constructor() {
    super();
    this.parsed = false;
    this.parentNodes = [];
  }

  connectedCallback(): void {}

  setup(): void {
    // collect the parentNodes
    let el: Node = this;
    while (el.parentNode) {
      el = el.parentNode;
      this.parentNodes.push(el);
    }
    // check if the parser has already passed the end tag of the component
    // in which case this element, or one of its parents, should have a nextSibling
    // if not (no whitespace at all between tags and no nextElementSiblings either)
    // resort to DOMContentLoaded or load having triggered
    if (
      [this, ...this.parentNodes].some((el) => el.nextSibling) ||
      document.readyState !== "loading"
    ) {
      this.childrenAvailableCallback();
    } else {
      this.renderCompleteObserver = new MutationObserver(() => {
        if (
          [this, ...this.parentNodes].some((el) => el.nextSibling) ||
          document.readyState !== "loading"
        ) {
          this.childrenAvailableCallback();
          this.renderCompleteObserver.disconnect();
        }
      });

      this.renderCompleteObserver.observe(this, { childList: true });
    }
  }

  childrenAvailableCallback(): void {}
}
