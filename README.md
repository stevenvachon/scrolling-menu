# &lt;scrolling-menu/&gt; [![NPM Version][npm-image]][npm-url] [![Published on webcomponents.org][webcomponents-image]][webcomponents-url] ![File Size][filesize-image] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Monitor][greenkeeper-image]][greenkeeper-url]

> A (native) web component for a menu that scrolls horizontally or vertically.

* Based on [Shadow DOM v1](http://w3c.github.io/webcomponents/spec/shadow/) and [Custom Elements v1](https://html.spec.whatwg.org/multipage/scripting.html#custom-elements).
* Menu items (`<option>`) are virtualized, meaning that only those within visible boundaries are added to the DOM tree, thereby supporting very long lists.
* Mostly unstyled, making customization simpler.

![Example](/example.gif?raw=true)

Check out the [feature demo](https://stevenvachon.github.io/scrolling-menu).


## Installation

[Node.js](http://nodejs.org) `>= 10` is required. To install, type this at the command line:
```shell
npm install scrolling-menu
```


## Usage

Import as an ES Module:
```js
import 'scrolling-menu';
```

Import as a CommonJS Module:
```js
require('scrolling-menu');
```

Instantiate via HTML:
```html
<scrolling-menu>
  <option value="1">Label 1</option>
  <option value="2" selected>Label 2</option>
  <option value="3" disabled>Label 3</option>
</scrolling-menu>
```

Instantiate via JavaScript:
```js
document.createElement('scrolling-menu').append(document.createElement('option'));
```


## DOM Properties

### `direction` property
Type: `String`  
Default value: `'vertical'`  
The axis with which menu options follow. Possible values: `'horizontal'`, `'vertical'`.

### `disabled` property
Type: `Boolean`  
Default value: `false`  
Sets the state of user interactivity. Inspired by [`HTMLElement::disabled`](https://mdn.io/attribute/disabled).

### `selectedIndex` property
Type: `Number`  
The index of the last selected option, where multiple selections are not possible. Inspired by [`HTMLSelectElement::selectedIndex`](https://mdn.io/HTMLSelectElement::selectedIndex).


## Attributes

### `direction` attribute
See [`direction` property](#direction-property).

### `disabled` attribute
See [`disabled` property](#disabled-property).


## Events

### `change` event
See [`HTMLElement` `change` event](https://mdn.io/change_event).

### `input` event
See [`HTMLElement` `input` event](https://mdn.io/input_event).


## Slots

### `decrement` slot
Custom HTML content for the UI control that decrements the selected option.

```html
<scrolling-menu>
  <span slot="decrement">
    <i class="some-icon"></i>
    Decrement
  </span>
</scrolling-menu>
```

### `increment` slot
Custom HTML content for the UI control that increments the selected option.

```html
<scrolling-menu>
  <span slot="increment">
    <i class="some-icon"></i>
    Increment
  </span>
</scrolling-menu>
```

### `option` slot
Custom HTML content for each menu item. Instances of `{{label}}` and `{{value}}` will be interpolated.

```html
<scrolling-menu>
  <a href="path/{{value}}" slot="option">
    <i class="some-icon"></i>
    {{label}}
  </a>
</scrolling-menu>
```


## CSS Parts

### `disabled-option` part
The disabled-state [`option` part](#option-part).
```css
scrolling-menu::part(disabled-option) {
  /* … */
}
```

### `option` part
The element that contains the [`option` slot](#option-slot).
```css
scrolling-menu::part(option) {
  /* … */
}
```

### `options-container` part
The element that contains [elements that contain] [`option` parts](#option-part).
```css
scrolling-menu::part(options-container) {
  /* … */
}
```

### `selected-option` part
The selected-state [`option` part](#option-part).
```css
scrolling-menu::part(selected-option) {
  /* … */
}
```


## Compatibility

Depending on your target browsers, you may need polyfills/shims for the following:

* [`Array::find`](https://mdn.io/Array::find), [`Array.from`](https://mdn.io/Array.from), [`Array::includes`](https://mdn.io/Array::includes)
* [`attachShadow`](https://mdn.io/attachShadow), [`customElements`](https://mdn.io/window.customElements)
* [`classList`](https://mdn.io/classList), [`toggleAttribute`](https://mdn.io/toggleAttribute)
* [`dispatchEvent`](https://mdn.io/dispatchEvent), [`new Event()`](https://mdn.io/Event/Event)
* [`Math.trunc`](https://mdn.io/Math.trunc), [`Number.isNaN`](https://mdn.io/Number.isNaN)
* [`MutationObserver`](https://mdn.io/MutationObserver), [`ResizeObserver`](https://mdn.io/ResizeObserver)
* [`requestAnimationFrame`](https://mdn.io/requestAnimationFrame)
* [`<template>`](https://mdn.io/template)


## FAQ
1. **Why not add `options` and `selectedOptions` properties from `HTMLSelectElement`?**  
Unfortunately, they're live `HTMLElement` collections that cannot be extended.


[npm-image]: https://img.shields.io/npm/v/scrolling-menu.svg
[npm-url]: https://npmjs.com/package/scrolling-menu
[webcomponents-image]: https://img.shields.io/badge/webcomponents.org-unpublished-red.svg
[webcomponents-url]: https://www.webcomponents.org/element/scroller-menu
[filesize-image]: https://img.shields.io/badge/size-8.4kB%20gzipped-blue.svg
[travis-image]: https://img.shields.io/travis/stevenvachon/scrolling-menu.svg
[travis-url]: https://travis-ci.org/stevenvachon/scrolling-menu
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/scrolling-menu.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/scrolling-menu
[greenkeeper-image]: https://badges.greenkeeper.io/stevenvachon/scrolling-menu.svg
[greenkeeper-url]: https://greenkeeper.io/
