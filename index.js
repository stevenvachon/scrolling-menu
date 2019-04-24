import {easeOutQuart} from "tween-functions";
import html from "create-html-template-element";
import HyperList from "hyperlist";
import replaceDOMStrings from "replace-dom-string";



const DIRECTION_NAME = "direction";
const DIRECTION_VALUE_HORIZONTAL = "horizontal";
const DIRECTION_VALUE_VERTICAL = "vertical";
const DIRECTION_VALUES = [DIRECTION_VALUE_HORIZONTAL, DIRECTION_VALUE_VERTICAL];
const DIRECTION_DEFAULT = DIRECTION_VALUE_VERTICAL;

const DISABLED_NAME = "disabled";
const DISABLED_DEFAULT = false;



const OPTION_TEMPLATE = html`
	<li part="option">
		<slot name="option">{{label}}</slot>
	</li>
`;



// @todo https://github.com/w3c/webcomponents/blob/gh-pages/proposals/Template-Instantiation.md
const TEMPLATE = html`
	<style>
		:host {
			contain: content;
			display: flex;
		}

		:host * {
			font-size: inherit;
			margin: 0;
			padding: 0;
		}

		.state {
			align-content: flex-start;
			display: flex;
			position: relative;
			width: 100%;
		}

		.state > button {
			z-index: 1; /* always above menu */
		}

		.state > button[part=increment] {
			order: 1;
		}

		.state > menu {
			box-sizing: border-box; /* for user styling */
			display: flex; /* 100% height */
			overflow: hidden !important;
			will-change: contents, scroll-position;
		}

		.state > menu > li {
			box-sizing: border-box; /* for user styling */
			display: block;
		}

		.state.disabled,
		.state.disabled * {
			pointer-events: none !important; /* not applied to :host so that custom cursors are still possible */
			-webkit-user-select: none !important; /* safari 12 */
			user-select: none !important;
		}

		.state.horizontal > menu {
			flex-wrap: nowrap;
		}

		.state.horizontal > menu > li {
			align-items: center;
			display: flex;
			height: 100%;
		}

		.state.vertical,
		.state.vertical > menu {
			flex-direction: column;
		}

		.state.vertical > menu > li {
			width: 100%; /* due to hyperlist's position:absolute */
		}
	</style>
	<div class="state">

		<button part="decrement" type="button">
			<slot name="decrement">Select Previous</slot>
		</button>

		<button part="increment" type="button">
			<slot name="increment">Select Next</slot>
		</button>

		<menu part="options-container"></menu>

	</div>
`;



// @todo https://www.chromestatus.com/feature/4708990554472448
class ScrollingMenu extends HTMLElement
{
	static observedAttributes = [DIRECTION_NAME, DISABLED_NAME];

	#decrementElement = null;
	#direction = DIRECTION_DEFAULT;
	#incrementElement = null;
	#isDisabled = DISABLED_DEFAULT;
	#menuElement = null;
	#mutationObserver = new MutationObserver(mutations => this.#handleMutation(mutations));
	#options = [];
	#requestId = 0;
	#scroller = null;
	#selectedIndex = -1;
	#stateElement = null;



	constructor()
	{
		super();

		this.attachShadow({mode: "open"});
		this.shadowRoot.append(TEMPLATE.content.cloneNode(true));

		this.#decrementElement = this.shadowRoot.querySelector("[part=decrement]");
		this.#incrementElement = this.shadowRoot.querySelector("[part=increment]");
		this.#menuElement = this.shadowRoot.querySelector("menu");
		this.#stateElement = this.shadowRoot.querySelector(".state");

		this.#addHoldEventListeners(this.#decrementElement, () => this.#offsetSelectedIndex(-1));
		this.#addHoldEventListeners(this.#incrementElement, () => this.#offsetSelectedIndex(1));

		this.#mutationObserver.observe(this, { attributes:true, childList:true, subtree:true });
	}



	/**
	 * Attach the necessary event listeners to run a callback repeatedly when "held" by the user.
	 * @param {HTMLElement} element
	 * @param {Function} callback
	 * @todo https://github.com/mathiasvr/on-hold/issues/1
	 */
	#addHoldEventListeners(element, callback)
	{
		let pressed = false;
		let timeout;

		const cancelRepeatCallback = () => clearTimeout(timeout);

		const initialRepeatCallback = () =>
		{
			callback();
			timeout = setTimeout(repeatCallback, 250);
		};

		const repeatCallback = () =>
		{
			callback();
			timeout = setTimeout(repeatCallback, 50);
		};

		element.addEventListener("mousedown", () =>
		{
			initialRepeatCallback();
			pressed = true;
		});

		element.addEventListener("mouseleave", cancelRepeatCallback);

		element.addEventListener("mouseover", () =>
		{
			if (pressed)
			{
				repeatCallback();
			}
		});

		element.addEventListener("mouseup", () =>
		{
			cancelRepeatCallback();
			pressed = false;
		});
	}



	/**
	 * Handle changes to main element's observed attributes.
	 * @param {string} name
	 * @param {string|null} oldValue
	 * @param {string|null} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue)
	{
		const wasRemoved = newValue === null;

		if (!wasRemoved)
		{
			newValue = newValue.trim().toLowerCase();
		}

		switch (name)
		{
			case DIRECTION_NAME:
			{
				this.#direction = DIRECTION_VALUES.includes(newValue) ? newValue : DIRECTION_DEFAULT;
				break;
			}
			case DISABLED_NAME:
			{
				this.#isDisabled = !wasRemoved;
				break;
			}
		}

		this.#update();
	}



	/**
	 * Build a list of options from distributed (light tree) elements.
	 */
	#buildList()
	{
		let lastSelectedIndex = -1;

		this.#options = Array.from(this.querySelectorAll("option")).map((option, i) =>
		{
			if (option.hasAttribute("selected"))
			{
				lastSelectedIndex = i;
			}

			return {
				disabled: option.hasAttribute("disabled"),
				label: option.innerText.trim(),
				selected: false, // avoid duplicates
				value: option.getAttribute("value")
			};
		});

		if (this.#options.length>0 && lastSelectedIndex===-1)
		{
			lastSelectedIndex = 0; // default select first option
		}

		this.#setSelectedIndex(lastSelectedIndex, true);
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
		this.#update();
	}



	/**
	 * Create a (shadow DOM) menu option element.
	 * @param {Object} option
	 * @returns {HTMLElement}
	 */
	#createOptionElement({disabled, label, selected, value})
	{
		const element = OPTION_TEMPLATE.content.cloneNode(true);
		const part = element.querySelector("[part=option]");

		if (disabled)
		{
			part.setAttribute("part", "option disabled-option");
		}

		if (selected)
		{
			part.setAttribute("part", `${part.getAttribute("part")} selected-option`);
		}

		// Workaround for issue with a slot only being assigned once
		const innerSlot = element.querySelector("slot");
		const userSlot = this.querySelector("[slot=option]");
		innerSlot.remove();

		if (userSlot === null)
		{
			// Simulate fallback content
			part.innerHTML = innerSlot.innerHTML;
		}
		else
		{
			// Simulate auto-assignment
			const clonedSlot = userSlot.cloneNode(true);
			clonedSlot.removeAttribute("slot");

			// Avoid CSS issues
			clonedSlot.querySelectorAll("[part]").forEach(element => element.removeAttribute("part"));

			part.append(clonedSlot);
		}

		replaceDOMStrings(["{{label}}", "{{value}}"], [label, value], element);

		return element.firstElementChild;
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
		return this.#isDisabled;
	}



	/**
	 * DOM (setter) property for "disabled" attribute.
	 * @param {boolean|*} newValue
	 */
	set disabled(newValue)
	{
		newValue = !!newValue;
		this.#isDisabled = newValue; // `attributeChangedCallback` is async
		this.toggleAttribute(DISABLED_NAME, newValue);
	}



	/**
	 * Handle main element removed (not moved) from a document.
	 */
	disconnectedCallback()
	{
		this.#cancelAnimation();
	}



	/**
	 * Handle mutations to distributed (light tree) `<option>` and `slot` elements.
	 * @param {Array<MutationRecord>} mutations
	 */
	#handleMutation(mutations)
	{
		const hasOptionMutations = () => mutations.some(({addedNodes, removedNodes, target}) =>
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

		const hasSlotMutations = () => mutations.some(({addedNodes, removedNodes, target}) =>
		{
			addedNodes = Array.from(addedNodes);
			removedNodes = Array.from(removedNodes);

			return target===this && (addedNodes.find(isSlot) || removedNodes.find(isSlot));
		});

		const isOption = ({nodeName}) => nodeName === "OPTION";
		const isText = ({nodeType}) => nodeType === Node.TEXT_NODE;

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

		if (hasOptionMutations())
		{
			this.#buildList();
		}
		else if (hasSlotMutations())
		{
			this.#update();
		}
	}



	/**
	 * Initialize (and re-initialize) the virtualized/windowed scroller.
	 */
	#initializeScroller()
	{
		if (this.#scroller !== null)
		{
			// @todo https://github.com/tbranyen/hyperlist/issues/54
			this.#scroller.destroy();
			this.#scroller = null;
		}

		const optionSize = () =>
		{
			// @todo store in class for reuse
			const tempOption = this.#createOptionElement(
			{
				disabled: false,
				label: "temp",
				selected: false,
				value: ""
			});

			this.#menuElement.append(tempOption);

			let size;

			if (this.#direction === DIRECTION_VALUE_HORIZONTAL)
			{
				size = tempOption.offsetWidth;
			}
			else
			{
				size = tempOption.offsetHeight;
			}

			tempOption.remove();

			return size;
		};

		// @todo https://github.com/tbranyen/hyperlist/issues/52
		const scrollerElement = this.ownerDocument.createElement("li");
		scrollerElement.setAttribute("aria-hidden", "true");

		this.#scroller = new HyperList(this.#menuElement,
		{
			horizontal: this.#direction === DIRECTION_VALUE_HORIZONTAL,
			itemHeight: optionSize(),
			generate: i => this.#createOptionElement(this.#options[i]),
			scroller: scrollerElement,
			total: this.#options.length
		});
	}


	/**
	 * Change the currently selected option to a potential neighbour, skipping any disabled.
	 * @param {number} offset
	 */
	#offsetSelectedIndex(offset)
	{
		const index = this.#selectedIndex + offset;
		const option = this.#options[index];

		if (option === undefined)
		{
			// Do nothing
		}
		else if (!option.disabled)
		{
			option.selected = true;
			this.#setSelectedIndex(index);
		}
		else if (offset > 0)
		{
			this.#offsetSelectedIndex(offset + 1);
		}
		else if (offset < 0)
		{
			this.#offsetSelectedIndex(offset - 1);
		}
	}



	/**
	 * Scroll options list to an axis position.
	 * @param {number} position
	 */
	#scrollTo(position)
	{

		switch (this.#direction)
		{
			case DIRECTION_VALUE_HORIZONTAL:
			{
				this.#menuElement.scrollLeft = position;
				break;
			}
			case DIRECTION_VALUE_VERTICAL:
			{
				this.#menuElement.scrollTop = position;
				break;
			}
		}
	}



	/**
	 * Scroll options list to an axis position before the next repaint.
	 * @param {number} toPosition
	 * @param {number|undefined} fromPosition
	 * @param {number|undefined} duration
	 * @param {number|undefined} fromTime
	 */
	#scrollToBeforeRepaint(toPosition, fromPosition=0, duration=0, fromTime=Date.now())
	{
		this.#requestId = requestAnimationFrame(() =>
		{
			const currentTime = Date.now();
			const offsetTime = currentTime - fromTime;

			if (offsetTime >= duration)
			{
				this.#scrollTo(toPosition);
			}
			else
			{
				const newPosition = easeOutQuart(offsetTime, fromPosition, toPosition, duration);

				this.#scrollTo(newPosition);
				this.#scrollToBeforeRepaint(toPosition, fromPosition, duration, fromTime); // continue animation
			}
		});
	}



	/**
	 * DOM (getter) property for the index of the currently selected option.
	 * @returns {number}
	 */
	get selectedIndex()
	{
		return this.#selectedIndex;
	}



	/**
	 * DOM (setter) property for changing the currently selected option.
	 * @param {number|*} newValue
	 */
	set selectedIndex(newValue)
	{
		if (this.#options.length === 0)
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

		if (newValue<-1 || newValue>=this.#options.length)
		{
			newValue = -1;
		}
		else if (Number.isNaN(newValue))
		{
			newValue = this.#selectedIndex;
		}

		this.#setSelectedIndex(newValue);
	}



	/**
	 * Change the currently selected option.
	 * @param {number} newValue
	 * @param {boolean|undefined} forceUpdate
	 */
	#setSelectedIndex(newValue, forceUpdate=false)
	{
		// Deselect previous if it exists
		if (this.#selectedIndex>-1 && this.#selectedIndex<this.#options.length)
		{
			this.#options[this.#selectedIndex].selected = false;
		}

		if (newValue > -1)
		{
			this.#options[newValue].selected = true;
		}

		if (newValue!==this.#selectedIndex || forceUpdate)
		{
			this.#selectedIndex = newValue;

			this.#update(!this.#isDisabled && !forceUpdate);

			this.dispatchEvent(new Event("input")); // @todo use `InputEvent` when possible
			this.dispatchEvent(new Event("change"));
		}
	}



	/**
	 * Update everything that is rendered.
	 * @param {boolean|undefined} animated
	 */
	#update(animated=false)
	{
		if (this.isConnected)
		{
			this.#updateStates(); // must be before `initializeScroller`
			this.#initializeScroller();
			this.#updateScrollPosition(animated);
		}
	}



	/**
	 * Recalculate the target scroll position (and scroll to it).
	 * @param {boolean} animated
	 */
	#updateScrollPosition(animated)
	{
		this.#cancelAnimation();

		let toPosition;

		if (this.#selectedIndex === -1)
		{
			toPosition = 0;
		}
		else
		{
			toPosition = this.#scroller._itemPositions[this.#selectedIndex];
		}

		if (!animated)
		{
			this.#scrollToBeforeRepaint(toPosition);
		}
		else
		{
			let fromPosition;

			switch (this.#direction)
			{
				case DIRECTION_VALUE_HORIZONTAL:
				{
					fromPosition = this.#menuElement.scrollLeft;
					break;
				}
				case DIRECTION_VALUE_VERTICAL:
				{
					fromPosition = this.#menuElement.scrollTop;
					break;
				}
			}

			this.#scrollToBeforeRepaint(toPosition, fromPosition, 400);
		}
	}



	/**
	 * Update element attributes and class names that handle visual state.
	 */
	#updateStates()
	{
		const isInteractive = !this.#isDisabled && this.#options.length>1;
		this.#decrementElement.toggleAttribute("disabled", !isInteractive);
		this.#incrementElement.toggleAttribute("disabled", !isInteractive);

		this.#stateElement.classList.toggle("disabled", this.#isDisabled);
		this.#stateElement.classList.toggle("horizontal", this.#direction === DIRECTION_VALUE_HORIZONTAL);
		this.#stateElement.classList.toggle("vertical", this.#direction === DIRECTION_VALUE_VERTICAL);
	}
}



export default customElements.define("scrolling-menu", ScrollingMenu);
