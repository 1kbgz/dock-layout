import { createIfNotDefined, HTMLBaseElement } from './base.js';
import { ResizeablePanel } from './resizeable.js';
import { SplitPanel } from './split.js';

createIfNotDefined('dl-resizeable-panel', ResizeablePanel);
createIfNotDefined('dl-split-panel', SplitPanel);
