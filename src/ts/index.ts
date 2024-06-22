import { createIfNotDefined, HTMLBaseElement } from './base.js';
import { ResizeablePanel } from './resizeable.js';
import { SplitPanel } from './split.js';

createIfNotDefined('tkp-resizeable-panel', ResizeablePanel);
createIfNotDefined('tkp-split-panel', SplitPanel);
