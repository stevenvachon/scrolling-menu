"use strict";
const {after, afterEach, before, it} = require("mocha");
const puppeteer = require("puppeteer");
const puppeteerCoverage = require("puppeteer-to-istanbul");

const runInBrowser = func => () => page.evaluate(func);

let browser, page;



// @todo also use npmjs.com/puppeteer-firefox
before(async () =>
{
	browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	page = await browser.newPage();

	page.on("console", async msg => console[msg._type](...await Promise.all(msg.args().map(arg => arg.jsonValue()))));
	page.on("pageerror", console.error);

	await Promise.all(
	[
		page.addScriptTag({ path: "node_modules/chai/chai.js" }),
		page.addScriptTag({ path: "demo/component.js" }),

		// @todo https://github.com/istanbuljs/puppeteer-to-istanbul/issues/18
		// @todo https://github.com/GoogleChrome/puppeteer/issues/3570
		page.coverage.startJSCoverage({ reportAnonymousScripts: true })
	]);

	await page.evaluate(() =>
	{
		// For awaiting asynchronous behavior
		window.delay = () => new Promise(resolve => setTimeout(() => resolve(), 10));

		// Alias for MutationObserver
		window.asyncMutation = delay;

		window.expect = chai.expect;
		delete window.chai; // cleanup
	});
});



afterEach(runInBrowser(() =>
{
	document.querySelectorAll("scrolling-menu").forEach(component => component.remove());
}));



after(async () =>
{
	let coverage = await page.coverage.stopJSCoverage();

	// Exclude tools
	coverage = coverage.filter(({url}) => !url.includes("chai"));

	puppeteerCoverage.write(coverage);

	browser.close();
});



it("is a defined element", runInBrowser(() =>
{
	const constructor = customElements.get("scrolling-menu");
	expect(constructor).to.be.a("function");
}));



describe(`"disabled" attribute`, () =>
{
	it("does not exist by default", runInBrowser(() =>
	{
		const component = document.createElement("scrolling-menu");
		expect(component.hasAttribute("disabled")).to.be.false;
	}));



	it("changes state with string values (like HTMLSelectElement)", runInBrowser(() =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		["", "disabled", "true", "false", "0"].forEach(newValue =>
		{
			component.setAttribute("disabled", newValue);
			select.setAttribute("disabled", newValue);
			expect(component.disabled).to.be.true;
			expect(select.disabled).to.be.true;
		});
	}));



	it("changes state when removed (like HTMLSelectElement)", runInBrowser(() =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		component.setAttribute("disabled", "");
		select.setAttribute("disabled", "");
		expect(component.disabled).to.be.true;
		expect(select.disabled).to.be.true;

		component.removeAttribute("disabled");
		select.removeAttribute("disabled");
		expect(component.disabled).to.be.false;
		expect(select.disabled).to.be.false;
	}));
});



describe(`"disabled" property`, () =>
{
	it("is false by default", runInBrowser(() =>
	{
		const component = document.createElement("scrolling-menu");
		expect(component.disabled).to.be.false;
	}));



	it("changes state with string and non-string values (like HTMLSelectElement)", runInBrowser(() =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		["disabled", "true", "false", "0", true, 1, {}, []].forEach(newValue =>
		{
			component.disabled = newValue;
			select.disabled = newValue;
			expect(component.disabled).to.be.true;
			expect(select.disabled).to.be.true;
			expect(component.hasAttribute("disabled")).to.be.true;
			expect(select.hasAttribute("disabled")).to.be.true;
		});

		["", false, null, undefined, 0].forEach(newValue =>
		{
			component.disabled = newValue;
			select.disabled = newValue;
			expect(component.disabled).to.be.false;
			expect(select.disabled).to.be.false;
			expect(component.hasAttribute("disabled")).to.be.false;
			expect(select.hasAttribute("disabled")).to.be.false;
		});
	}));
});



describe(`"selectedIndex" property`, () =>
{
	it("is -1 when there're no options (like HTMLSelectElement)", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		const componentOption = document.createElement("option");
		const select = document.createElement("select");
		const selectOption = document.createElement("option");

		expect(component.selectedIndex).to.equal(-1);
		expect(select.selectedIndex).to.equal(-1);

		component.selectedIndex = 0;
		select.selectedIndex = 0;
		expect(component.selectedIndex).to.equal(-1);
		expect(select.selectedIndex).to.equal(-1);

		component.append(componentOption);
		select.append(selectOption);
		await asyncMutation();
		expect(component.selectedIndex).not.to.equal(-1);
		expect(select.selectedIndex).not.to.equal(-1);

		componentOption.remove();
		selectOption.remove();
		await asyncMutation();
		expect(component.selectedIndex).to.equal(-1);
		expect(select.selectedIndex).to.equal(-1);
	}));



	it("is 0 when there're no selected options (like HTMLSelectElement)", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		expect(component.selectedIndex).to.equal(-1);
		expect(select.selectedIndex).to.equal(-1);

		Array.from({ length:2 }).forEach(() =>
		{
			component.append(document.createElement("option"));
			select.append(document.createElement("option"));
		});

		await asyncMutation();

		expect(component.selectedIndex).to.equal(0);
		expect(select.selectedIndex).to.equal(0);
	}));



	it("changes selection with numerical values (like HTMLSelectElement)", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		Array.from({ length:2 }).forEach(() =>
		{
			component.append(document.createElement("option"));
			select.append(document.createElement("option"));
		});

		await asyncMutation();

		const resetSelectedIndexes = () =>
		{
			component.selectedIndex = 0;
			select.selectedIndex = 0;
			expect(component.selectedIndex).to.equal(0);
			expect(select.selectedIndex).to.equal(0);
		};

		[0, 1].forEach(newValue =>
		{
			component.selectedIndex = newValue;
			select.selectedIndex = newValue;
			expect(component.selectedIndex).to.equal(newValue);
			expect(select.selectedIndex).to.equal(newValue);
		});

		[1, 1.5, "1", "1.5"].forEach(newValue =>
		{
			resetSelectedIndexes();
			component.selectedIndex = newValue;
			select.selectedIndex = newValue;
			expect(component.selectedIndex).to.equal(1);
			expect(select.selectedIndex).to.equal(1);
		});

		[-2, -1, 2, "-2", "-1", "2"].forEach(newValue =>
		{
			resetSelectedIndexes();
			component.selectedIndex = newValue;
			select.selectedIndex = newValue;
			expect(component.selectedIndex).to.equal(-1);
			expect(select.selectedIndex).to.equal(-1);
		});
	}));



	it("ignores values that are not numerical (like HTMLSelectElement)", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		const select = document.createElement("select");

		Array.from({ length:2 }).forEach(() =>
		{
			component.append(document.createElement("option"));
			select.append(document.createElement("option"));
		});

		await asyncMutation();

		[{}, [], "abc"].forEach(newValue =>
		{
			component.selectedIndex = newValue;
			select.selectedIndex = newValue;
			expect(component.selectedIndex).to.equal(0);
			expect(select.selectedIndex).to.equal(0);
		});
	}));
});



describe(`"change" event`, () =>
{
	it("is dispatched when an option is selected", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		component.append(document.createElement("option"), document.createElement("option"));
		await asyncMutation();

		component.addEventListener("change", event =>
		{
			dispatchedEvent = event;
			dispatchedEventTarget = event.target; // this property changes as it goes through the loop
		});

		let dispatchedEvent, dispatchedEventTarget;
		component.selectedIndex = 1;

		expect(dispatchedEvent).to.be.an.instanceOf(Event);
		expect(dispatchedEventTarget).to.equal(component);
	}));
});



describe(`"input" event`, () =>
{
	it("is dispatched when an option is selected", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		component.append(document.createElement("option"), document.createElement("option"));
		await asyncMutation();

		component.addEventListener("input", event =>
		{
			dispatchedEvent = event;
			dispatchedEventTarget = event.target; // this property changes as it goes through the loop
		});

		let dispatchedEvent, dispatchedEventTarget;
		component.selectedIndex = 1;

		expect(dispatchedEvent).to.be.an.instanceOf(Event);
		expect(dispatchedEventTarget).to.equal(component);
	}));
});



describe(`"decrement" slot`, () =>
{
	it("is assigned within the shadow DOM", runInBrowser(() =>
	{
		const lightSlot = document.createElement("span");
		lightSlot.setAttribute("slot", "decrement");
		lightSlot.innerText = "Custom content";

		const component = document.createElement("scrolling-menu");
		component.append(lightSlot);

		const shadowSlot = component.shadowRoot.querySelector("slot[name=decrement]");
		const assignedNodes = shadowSlot.assignedNodes();

		expect(assignedNodes).to.have.length(1);
		expect(assignedNodes[0]).to.equal(lightSlot);
	}));
});



describe(`"increment" slot`, () =>
{
	it("is assigned within the shadow DOM", runInBrowser(() =>
	{
		const lightSlot = document.createElement("span");
		lightSlot.setAttribute("slot", "increment");
		lightSlot.innerText = "Custom content";

		const component = document.createElement("scrolling-menu");
		component.append(lightSlot);

		const shadowSlot = component.shadowRoot.querySelector("slot[name=increment]");
		const assignedNodes = shadowSlot.assignedNodes();

		expect(assignedNodes).to.have.length(1);
		expect(assignedNodes[0]).to.equal(lightSlot);
	}));
});



describe(`"option" slot`, () =>
{
	it("is cloned within the shadow DOM with interpolated variables", runInBrowser(async () =>
	{
		const lightOption1 = document.createElement("option");
		lightOption1.setAttribute("value", "some value 1");
		lightOption1.innerText = "some label 1";

		const lightOption2 = document.createElement("option");
		lightOption2.setAttribute("value", "some value 2");
		lightOption2.innerText = "some label 2";

		const lightSlot = document.createElement("span");
		lightSlot.setAttribute("data-value", "{{value}}");
		lightSlot.setAttribute("slot", "option");
		lightSlot.innerHTML = "prefix <span>{{label}}</span> suffix";

		const component = document.createElement("scrolling-menu");
		component.append(lightOption1, lightOption2, lightSlot);
		document.body.append(component); // for `isConnected` conditions
		await asyncMutation();

		const shadowOptions = component.shadowRoot.querySelectorAll("menu li:not([aria-hidden])");

		expect(shadowOptions).to.have.length(2); // ensure mutation occurred

		shadowOptions.forEach((option, i) =>
		{
			expect(option.querySelectorAll("slot")).to.be.empty;

			const clonedSlot = option.firstElementChild;
			expect(clonedSlot.assignedNodes).not.to.be.a("function");
			expect(clonedSlot.getAttribute("data-value")).to.equal(`some value ${i + 1}`);
			expect(clonedSlot.hasAttribute("slot")).to.be.false;
			expect(clonedSlot.innerHTML).to.equal(`prefix <span>some label ${i + 1}</span> suffix`);
			expect(clonedSlot.tagName).to.equal(lightSlot.tagName);
		});
	}));
});



describe(`"disabled-option" CSS part`, () =>
{
	it("is exposed", runInBrowser(async () =>
	{
		const lightOption1 = document.createElement("option");
		const lightOption2 = document.createElement("option");
		const lightOption3 = document.createElement("option");
		lightOption1.setAttribute("disabled", "");
		lightOption2.setAttribute("disabled", "");
		lightOption2.setAttribute("selected", "");

		const component = document.createElement("scrolling-menu");
		component.append(lightOption1, lightOption2, lightOption3);
		document.body.append(component); // for `isConnected` conditions
		await asyncMutation();

		const parts = component.shadowRoot.querySelectorAll("[part~=disabled-option]");
		expect(parts).to.have.length(2);
	}));
});



describe(`"option" CSS part`, () =>
{
	it("is exposed", runInBrowser(async () =>
	{
		const lightOption1 = document.createElement("option");
		const lightOption2 = document.createElement("option");
		const lightOption3 = document.createElement("option");
		lightOption1.setAttribute("disabled", "");
		lightOption2.setAttribute("selected", "");

		const component = document.createElement("scrolling-menu");
		component.append(lightOption1, lightOption2, lightOption3);
		document.body.append(component); // for `isConnected` conditions
		await asyncMutation();

		const parts = component.shadowRoot.querySelectorAll("[part~=option]");
		expect(parts).to.have.length(3);
	}));
});



describe(`"options-container" CSS part`, () =>
{
	it("is exposed", runInBrowser(async () =>
	{
		const component = document.createElement("scrolling-menu");
		const parts = component.shadowRoot.querySelectorAll("[part~=options-container]");
		expect(parts).to.have.length(1);
	}));
});



describe(`"selected-option" CSS part`, () =>
{
	it("is exposed", runInBrowser(async () =>
	{
		const lightOption1 = document.createElement("option");
		const lightOption2 = document.createElement("option");
		const lightOption3 = document.createElement("option");
		lightOption1.setAttribute("disabled", "");
		lightOption2.setAttribute("selected", "");

		const component = document.createElement("scrolling-menu");
		component.append(lightOption1, lightOption2, lightOption3);
		document.body.append(component); // for `isConnected` conditions
		await asyncMutation();

		const parts = component.shadowRoot.querySelectorAll("[part~=selected-option]");
		expect(parts).to.have.length(1);
	}));
});
