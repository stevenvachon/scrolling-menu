# scrolling-menu [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url]

[![Greenkeeper badge](https://badges.greenkeeper.io/stevenvachon/scrolling-menu.svg)](https://greenkeeper.io/)

> A (native) web component for a horizontally or vertically scrolling menu.

* Menu items are virtualized, meaning that only those within visible boundaries are added to the DOM tree, thereby supporting very long lists.
* All menu items, rendered or not, work with find-in-page (?).

Check out the [demo](https://stevenvachon.github.io/scrolling-menu).


## Installation

[Node.js](http://nodejs.org/) `>= 10` is required. To install, type this at the command line:
```shell
npm install scrolling-menu
```


## Importing

ES Module:
```js
import 'scrolling-menu';
```

CommonJS Module:
```js
require('scrolling-menu');
```


## Usage

```html
<scrolling-menu>
  <option value="1">Label 1</option>
  <option value="2">Label 2</option>
</scrolling-menu>
```


## DOM Properties

### `alignItems`
Type: `String`  
Default value: `'center'`  
The alignment of list items. Possible values:

* `'center'`: between the start and the end.
* `'end'`: either the bottom or the right, depending on the value of [`direction`](#direction).
* `'start'`: either the top or the left, depending on the value of [`direction`](#direction).

### `decrement`
Type: `Boolean`  
Default value: `false`  
Whether or not to display a button for decrementing the selected item.

### `direction`
Type: `String`  
Default value: `'vertical'`  
The axis with which list items follow. Possible values: `'horizontal'`, `'vertical'`.

### `disabled`
Type: `Boolean`  
Default value: `false`  
Sets the state of user interactivity. Inspired by [`HTMLElement::disabled`](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/Attribute/disabled).

### `increment`
Type: `Boolean`  
Default value: `false`  
Whether or not to display a button for incrementing the selected item.

### `selectedIndex`
Type: `Number`  
The index of the last selected item, where multiple selections are not possible. Inspired by [`HTMLSelectElement::selectedIndex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedIndex).


## Attributes

### `align-items`
See [`alignItems`](#alignItems) property.

### `decrement`
See [`decrement`](#decrement) property.

### `direction`
See [`direction`](#direction) property.

### `disabled`
See [`disabled`](#disabled) property.

### `increment`
See [`increment`](#increment) property.


## Slots

### `decrement`
The HTML to use for a UI control that decrements the selected item.

```html
<scrolling-menu>
  <button slot="decrement">Decrement</button>
</scrolling-menu>
```

### `increment`
The HTML to use for a UI control that increments the selected item.

```html
<scrolling-menu>
  <button slot="increment">Increment</button>
</scrolling-menu>
```

### `item`
The HTML to use for each menu item. Instances of `{{label}}` and `{{value}}` will be interpolated.

```html
<scrolling-menu>
  <a href="path/{{value}}" slot="item">
    <i class="some-icon"></i>
    {{label}}
  </a>
</scrolling-menu>
```


## Compatibility

Depending on your target browsers, you may need polyfills/shims for the following:

* [`Array.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from)
* [`attachShadow`](https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow), [`customElements`](https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements)
* [`dispatchEvent`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent), [`new Event()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/Event)
* [`Math.trunc`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc)
* [`MutationObserver`](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
* [`Number.isNaN`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)
* [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
* [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
* [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)


[npm-image]: https://img.shields.io/npm/v/scrolling-menu.svg
[npm-url]: https://npmjs.com/package/scrolling-menu
[filesize-image]: https://img.shields.io/badge/size-4.6kB%20gzipped-blue.svg
[travis-image]: https://img.shields.io/travis/stevenvachon/scrolling-menu.svg
[travis-url]: https://travis-ci.org/stevenvachon/scrolling-menu
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/scrolling-menu.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/scrolling-menu
