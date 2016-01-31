import _ from 'lodash';
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


/**
 * Parse iso date and format it in a simple way
 * @param  {String} isoDate - date in iso format
 * @return {String}         - formatted date
 */
export function formatDate(isoDate) {
	let matches = isoDate.match(/(\d{4})\-?(\d{2})?-?(\d{2})?/);
	let date = isoDate;

	if(matches.length >= 4) {
		let year = matches[1];
		let month = months[parseInt(matches[2], 10) - 1];
		let day = parseInt(matches[3], 10);
		date = `${month} ${day}, ${year}`;
	}
	if(matches.length >= 3) {
		let year = matches[1];
		let month = months[parseInt(matches[2], 10) - 1];
		date = `${month} ${year}`;
	}
	if(matches.length >= 2) {
		date = matches[1];
	}

	return date;
}

/**
 * Formats category name
 * @param  {String} name 	- unformatted name
 * @return {String}      	- formatted name
 */
export function formatCategoryName(name) {
	name = name.replace(/(?! )[A-Z]/g, ' $&');
	return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Finds the first element that pasess function test by
 * testing the element itself and traversing up
 * @param  {HTMLElement}   el 	- A DOM element from which tracersing begins
 * @param  {Function} fn 		- Function that tests if element is suitable
 * @return {HTMLElement}		- First element that passes the test
 */
export function closest(el, fn) {
	return el && (fn(el) ? el : closest(el.parentNode, fn));
}

/**
 * Register a one-time event listener.
 *
 * @param {EventTarget} target
 * @param {String} type
 * @param {Function} listener
 * @returns {Function} deregister
 */
export function once(target, type, listener) {
	function deregister() {
		target.removeEventListener(type, handler); // eslint-disable-line no-use-before-define
	}

	function handler() {
		deregister();
		return listener.apply(this, arguments);
	}

	target.addEventListener(type, handler);

	return deregister;
}

/**
 * Cross-browser text range selection
 * @param  {HTMLElement} textEl		- A DOM element where text should be selected
 */
export function selectText(textEl) {
	if(document.body.createTextRange) {
		let range = document.body.createTextRange();
		range.moveToElementText(textEl);
		range.select();
	} else if(window.getSelection) {
		let selection = window.getSelection(),
			range = document.createRange();
		range.selectNodeContents(textEl);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

/**
 * Finds a correct name of a transitionend event
 * @return {String} 	- transitionend event name
 */
export function transitionend() {
	var i,
		el = document.createElement('div'),
		transitions = {
			'transition': 'transitionend',
			'OTransition': 'otransitionend',
			'MozTransition': 'transitionend',
			'WebkitTransition': 'webkitTransitionEnd'
		};

	for (i in transitions) {
		if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
			return transitions[i];
		}
	}
}

var collapsesInProgress = {};

function collapse(element) {
	let initialHeight = window.getComputedStyle(element).height;
	element.style.height = initialHeight;
	_.delay(() => {
		element.classList.add('zotero-collapsed', 'zotero-collapsing');
		element.style.height = null;
		collapsesInProgress[element] = once(element, transitionend(), () => {
			element.classList.remove('zotero-collapsing');
			delete collapsesInProgress[element];
		});
	}, 50);
}

function uncollapse(element) {
	element.classList.remove('zotero-collapsed');
	let targetHeight = window.getComputedStyle(element).height;
	element.classList.add('zotero-collapsed');

	_.defer(() => {
		element.classList.add('zotero-collapsing');
		element.style.height = targetHeight;
		collapsesInProgress[element] = once(element, transitionend(), () => {
			element.classList.remove('zotero-collapsed', 'zotero-collapsing');
			element.style.height = null;
			delete collapsesInProgress[element];
		});
	});
}

/**
 * Collpases or uncollapses a DOM element
 * @param  {HTMLElement} element 	- DOM element to be (un)collapsed
 */
export function toggleCollapse(element, override) {
	if(typeof override !== 'undefined') {
		override ? uncollapse(element) : collapse(element); // eslint-disable-line no-unused-expressions
		return override;
	}

	if(collapsesInProgress[element]) {
		collapsesInProgress[element]();
		let collapsing = !element.style.height;
		collapsing ? uncollapse(element) : collapse(element); // eslint-disable-line no-unused-expressions
		return collapsing;
	}
	else {
		let collapsed = element.classList.contains('zotero-collapsed');
		collapsed ? uncollapse(element) : collapse(element); // eslint-disable-line no-unused-expressions
		return collapsed;
	}
}
