import html from "create-html-template-element";
import isString from "is-string";
import replaceDOMStrings from "replace-dom-string";



const ALIGN_ITEMS_NAME = "align-items";
const ALIGN_ITEMS_VALUE_CENTER = "center";
const ALIGN_ITEMS_VALUE_END = "end";
const ALIGN_ITEMS_VALUE_START = "start";
const ALIGN_ITEMS_VALUES = [ALIGN_ITEMS_VALUE_CENTER, ALIGN_ITEMS_VALUE_END, ALIGN_ITEMS_VALUE_START];
const ALIGN_ITEMS_DEFAULT = ALIGN_ITEMS_VALUE_CENTER;

const DIRECTION_NAME = "direction";
const DIRECTION_VALUE_HORIZONTAL = "horizontal";
const DIRECTION_VALUE_VERTICAL = "vertical";
const DIRECTION_VALUES = [DIRECTION_VALUE_HORIZONTAL, DIRECTION_VALUE_VERTICAL];
const DIRECTION_DEFAULT = DIRECTION_VALUE_VERTICAL;

const DISABLED_NAME = "disabled";
const DISABLED_DEFAULT = false;



const ITEMS_TEMPLATE = html`
	<style>
		:host {
			/*contain: content;*/
			display: block;
			position: relative;
		}

		:host([disabled]) {
			-webkit-user-select: none !important; /* safari 12 */
			user-select: none !important;
		}

		:host([disabled]) * { /* not applied to :host so that custom cursors are still possible */
			pointer-events: none !important;
		}

		:host * {
			font-size: inherit;
		}

		menu {
			margin: 0;
			padding: 0;
		}

		menu > li {
			display: block;
		}

		menu.horizontal {
			align-content: flex-start;
			display: flex;
			flex-wrap: nowrap;
		}

		menu.horizontal li {
			margin: 0 .5em;
			padding: .5em;
		}

		menu.vertical li {
			margin: .5em 0;
		}
	</style>

	<button part="decrement" type="button">
		<slot name="decrement">Select Previous</slot>
	</button>

	<menu part="items-container"></menu>

	<button part="increment" type="button">
		<slot name="increment">Select Next</slot>
	</button>
`;



// @todo this didn't work as expected -- `<slot>` would only be assigned once (?)
/*const ITEM_TEMPLATE = html`
	<li part="item">
		<slot name="item">{{label}}</slot>
	</li>
`;*/



class ScrollingMenu extends HTMLElement
{
	static defaultEase = (currentPosition, targetPosition) => currentPosition + (targetPosition - currentPosition) / 2;

	static observedAttributes =
	[
		ALIGN_ITEMS_NAME,
		DIRECTION_NAME,
		DISABLED_NAME,
	];

	#alignItems = ALIGN_ITEMS_DEFAULT;
	#currentPosition = 0;
	#direction = DIRECTION_DEFAULT;
	#disabled = DISABLED_DEFAULT;
	#items = [];
	#mutationObserver = new MutationObserver(mutations => this.#handleMutation(mutations));
	#requestId = 0;
	#selectedIndex = -1;



	constructor()
	{
		super();

		this.attachShadow({mode: "open"});
		this.shadowRoot.appendChild(ITEMS_TEMPLATE.content.cloneNode(true));

		this.#updateMenuClassList();
	}



	/**
	 * Handle main element moved to another document.
	 */
	adoptedCallback()
	{
		this.#updateScrollPosition();
	}



	/**
	 * DOM (getter) property for "align-items" attribute.
	 * @returns {string}
	 */
	get alignItems()
	{
		return this.#alignItems;
	}



	/**
	 * DOM (setter) property for "align-items" attribute.
	 * @param {string|*} newValue
	 */
	set alignItems(newValue)
	{
		this.setAttribute(ALIGN_ITEMS_NAME, newValue);
	}



	/**
	 * Handle changes to main element's observed attributes.
	 * @param {string} name
	 * @param {string|null} oldValue
	 * @param {string|null} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue)
	{
		if (newValue !== null)
		{
			newValue = newValue.trim().toLowerCase();
		}

		switch (name)
		{
			case ALIGN_ITEMS_NAME:
			{
				this.#alignItems = ALIGN_ITEMS_VALUES.includes(newValue) ? newValue : ALIGN_ITEMS_DEFAULT;
				this.#updateMenuClassList();
				break;
			}
			case DIRECTION_NAME:
			{
				this.#direction = DIRECTION_VALUES.includes(newValue) ? newValue : DIRECTION_DEFAULT;
				this.#updateMenuClassList();
				break;
			}
			case DISABLED_NAME:
			{
				this.#disabled = this.#toBoolean(newValue);
				break;
			}
		}

		this.#updateScrollPosition();
	}



	/**
	 * Build a list of items from distributed (light DOM) elements.
	 */
	#buildList()
	{
		let lastSelectedIndex = -1;

		this.#items = Array.from(this.querySelectorAll("option")).map((option, i) =>
		{
			if (option.hasAttribute("selected"))
			{
				lastSelectedIndex = i;
			}

			return {
				label: option.innerText.trim(),
				selected: false, // avoid duplicates
				value: option.getAttribute("value")
			};
		});

		if (this.#items.length > 0 && lastSelectedIndex === -1)
		{
			lastSelectedIndex = 0; // default select first item
		}

		if (this.#items.length > 0)
		{
			this.#items[lastSelectedIndex].selected = true;
		}

		this.#selectedIndex = lastSelectedIndex;

		this.#renderList();
	}



	/**
	 * Cancel any scheduled animation.
	 */
	#cancelAnimation()
	{
		cancelAnimationFrame(this.#requestId);
	}



	/**
	 * Handle main element added (not moved) to a document.
	 */
	connectedCallback()
	{
		this.#mutationObserver.observe(this, { attributes:true, childList:true, subtree:true });
	}



	/**
	 * DOM (getter) property for "direction" attribute.
	 * @returns {string}
	 */
	get direction()
	{
		return this.#direction;
	}



	/**
	 * DOM (setter) property for "direction" attribute.
	 * @param {string|*} newValue
	 */
	set direction(newValue)
	{
		this.setAttribute(DIRECTION_NAME, newValue);
	}



	/**
	 * DOM (getter) property for "disabled" attribute.
	 * @returns {boolean}
	 */
	get disabled()
	{
		return this.#disabled;
	}



	/**
	 * DOM (setter) property for "disabled" attribute.
	 * @param {boolean|*} newValue
	 */
	set disabled(newValue)
	{
		this.#setBooleanAttribute(DISABLED_NAME, newValue);
	}



	/**
	 * Handle main element removed (not moved) from a document.
	 */
	disconnectedCallback()
	{
		this.#mutationObserver.disconnect();
		this.#cancelAnimation();
	}



	/**
	 * Handle mutations to distributed (light DOM) `<option>` and `slot` elements.
	 * @param {Array<MutationRecord>} mutations
	 */
	#handleMutation(mutations)
	{
		const isOption = ({nodeName}) => nodeName === "OPTION";
		const isText = ({nodeName}) => nodeName === "#text";

		const hasOptionMutations = mutations.some(({addedNodes, removedNodes, target}) =>
		{
			addedNodes = Array.from(addedNodes);
			removedNodes = Array.from(removedNodes);

			const isChildOfMain = target === this;
			const isChildOfOption = isOption(target);

			if (isChildOfMain && (addedNodes.find(isOption) || removedNodes.find(isOption)))
			{
				return true;
			}
			else if (isChildOfOption && (addedNodes.find(isText) || removedNodes.find(isText)))
			{
				return true;
			}
			else
			{
				return false;
			}
		});

		const isSlot = node =>
		{
			if (node.nodeType !== Node.ELEMENT_NODE)
			{
				return false;
			}
			else if (!node.hasAttributes())
			{
				return false;
			}
			else
			{
				return Array.from(node.attributes).map(({name}) => name).includes("slot");
			}
		};

		const hasSlotMutations = () => mutations.some(({addedNodes, removedNodes, target}) =>
		{
			addedNodes = Array.from(addedNodes);
			removedNodes = Array.from(removedNodes);

			return target===this && (addedNodes.find(isSlot) || removedNodes.find(isSlot));
		});

		if (hasOptionMutations)
		{
			this.#buildList();
		}
		else if (hasSlotMutations())
		{
			this.#renderList();
		}
	}



	/**
	 * Render the items list to the shadow DOM.
	 */
	#renderList()
	{
		const oldMenu = this.shadowRoot.querySelector("menu");
		const newMenu = oldMenu.cloneNode(false);
		const variables = ["{{label}}", "{{value}}"];

		// Workaround for issue with a slot only being assigned once
		const itemSlot = this.querySelector("[slot=item]");

		this.#items.forEach(({label, selected, value}) =>
		{
			// Original; non-working
			//const item = ITEM_TEMPLATE.content.cloneNode(true);

			const item = document.createElement("li");

			if (selected)
			{
				item.setAttribute("part", "item selected-item");
			}
			else
			{
				item.setAttribute("part", "item");
			}

			if (itemSlot === null)
			{
				item.innerText = "{{label}}";
			}
			else
			{
				// Simulate auto-assignment
				const clonedSlot = itemSlot.cloneNode(true);
				clonedSlot.removeAttribute("slot");

				item.appendChild(clonedSlot);
			}

			replaceDOMStrings(variables, [label, value], item);

			newMenu.appendChild(item);
		});

		oldMenu.parentNode.replaceChild(newMenu, oldMenu);

		this.#updateScrollPosition();
	}



	/**
	 * Scroll items list to an axis position.
	 * @param {number} position
	 */
	#scrollTo(position)
	{
		this.#currentPosition = position;
	}



	/**
	 * Scroll items list to an axis position before the next repaint.
	 * @param {number} targetPosition
	 * @param {boolean} animated
	 */
	#scrollToBeforeRepaint(targetPosition, animated=false)
	{
		if (!animated)
		{
			this.#requestId = requestAnimationFrame(() => this.#scrollTo(targetPosition));
		}
		else
		{
			this.#requestId = requestAnimationFrame(() =>
			{
				const newPosition = ScrollingMenu.defaultEase(this.#currentPosition, targetPosition);

				if (newPosition !== this.#currentPosition)
				{
					this.#scrollTo(newPosition);
					this.#scrollToBeforeRepaint(targetPosition, animated); // continue animation
				}
			});
		}
	}



	/**
	 * Return the index of the currently selected item.
	 * @returns {number}
	 */
	get selectedIndex()
	{
		return this.#selectedIndex;
	}



	/**
	 * Change the currently selected item.
	 * @param {number|*} newValue
	 */
	set selectedIndex(newValue)
	{
		if (this.#items.length === 0)
		{
			newValue = -1;
		}
		else if (typeof newValue === "number")
		{
			newValue = Math.trunc(newValue);
		}
		else
		{
			newValue = parseInt(newValue, 10);
		}

		if (newValue < -1 || newValue > this.#items.length)
		{
			newValue = -1;
		}
		else if (Number.isNaN(newValue))
		{
			newValue = this.#selectedIndex;
		}

		if (newValue !== this.#selectedIndex)
		{
			this.#items[newValue].selected = true;
			this.#items[this.#selectedIndex].selected = false;

			this.#selectedIndex = newValue;

			this.#updateScrollPosition(true);
		}
	}



	/**
	 * Add, remove or change an attribute based on its string representation of a boolean value.
	 * @param {string} string
	 * @param {string|*} value
	 */
	#setBooleanAttribute(name, value)
	{
		if (isString(value))
		{
			this.setAttribute(name, value);
		}
		else if (!!value)
		{
			this.setAttribute(name, "");
		}
		else
		{
			this.removeAttribute(name);
		}
	}



	/**
	 * Convert an attribute string value into a boolean.
	 * @param {string} value
	 */
	#toBoolean(value)
	{
		return value==="" || !!value;
	}



	/**
	 * Update the class names applied to the `<menu>` element.
	 */
	#updateMenuClassList()
	{
		const {classList} = this.shadowRoot.querySelector("menu");

		classList.toggle("horizontal", this.#direction === DIRECTION_VALUE_HORIZONTAL);
		classList.toggle("vertical", this.#direction === DIRECTION_VALUE_VERTICAL);

		classList.toggle("center", this.#alignItems === ALIGN_ITEMS_VALUE_CENTER);
		classList.toggle("end", this.#alignItems === ALIGN_ITEMS_VALUE_END);
		classList.toggle("start", this.#alignItems === ALIGN_ITEMS_VALUE_START);
	}



	/**
	 * Recalculate the target scroll position (and scroll to it).
	 * @param {boolean} animated
	 */
	#updateScrollPosition(animated = false)
	{
		this.#cancelAnimation();

		if (this.isConnected)
		{
			const targetPosition = 0;

			this.#scrollToBeforeRepaint(targetPosition, animated);
		}
	}
}



export default customElements.define
(
	"scrolling-menu",
	ScrollingMenu
);
