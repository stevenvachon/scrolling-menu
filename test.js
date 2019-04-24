"use strict";
const {after, before, it} = require("mocha");
const puppeteer = require("puppeteer");
const puppeteerCoverage = require("puppeteer-to-istanbul");

const runInBrowser = func => () => page.evaluate(func);

let browser, page;



// @todo also use npmjs.com/puppeteer-firefox
before(async () =>
{
	browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	page = await browser.newPage();

	page.on("console", msg => msg.args().forEach(async arg => console.log(await arg.jsonValue())));

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
		window.expect = chai.expect;
		delete window.chai; // cleanup
	});
});



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
