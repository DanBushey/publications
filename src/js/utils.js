import _ from 'lodash';
import balanced from 'balanced-match';
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

export function formatAbstract(abstract) {
	return abstract.replace(/(^|\n)([\s\S]*?)(\n|$)/g, '<p>$2</p>');
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
 * Finds the first element that pasess function test by testing the element itself
 * and traversing up
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
 * Uniquely and pernamently identify a DOM element even if it has no id
 * @param  {HTMLElement} target - DOM element to identify
 * @return {String} 			- unique identifier
 */
export function id(target) {
	target.id = target.id || _.uniqueId('zotero-element-');
	return target.id;
}


/**
 * Finds a correct name of a transitionend event
 * @return {String} 	- transitionend event name
 */
export function onTransitionEnd(target, callback, timeout) {
	var i,
	el = document.createElement('div'),
	eventName,
	possibleEventNames = {
		'transition': 'transitionend',
		'OTransition': 'otransitionend',
		'MozTransition': 'transitionend',
		'WebkitTransition': 'webkitTransitionEnd'
	};

	for (i in possibleEventNames) {
		if (possibleEventNames.hasOwnProperty(i) && el.style[i] !== undefined) {
			eventName = possibleEventNames[i];
		}
	}

	if(timeout) {
		setTimeout(() => {
			callback('timeout');
		}, timeout);
	}

	return once(target, eventName, () => {
		callback(eventName);
	});
}

var collapsesInProgress = {};

function collapse(element) {
	let initialHeight = getComputedStyle(element).height;
	element.style.height = initialHeight;
	//repaint shenanigans
	element.offsetHeight; // eslint-disable-line no-unused-expressions

	_.defer(() => {
		element.classList.add('zotero-collapsed', 'zotero-collapsing');
		element.style.height = null;
		collapsesInProgress[id(element)] = onTransitionEnd(element, () => {
			element.classList.remove('zotero-collapsing');
			element.setAttribute('aria-hidden', 'true');
			element.setAttribute('aria-expanded', 'false');
			delete collapsesInProgress[id(element)];
		}, 500);
	});
}

function uncollapse(element) {
	element.classList.remove('zotero-collapsed');
	let targetHeight = getComputedStyle(element).height;
	element.classList.add('zotero-collapsed');

	_.defer(() => {
		element.classList.add('zotero-collapsing');
		element.style.height = targetHeight;
		collapsesInProgress[id(element)] = onTransitionEnd(element, () => {
			element.classList.remove('zotero-collapsed', 'zotero-collapsing');
			element.setAttribute('aria-hidden', 'false');
			element.setAttribute('aria-expanded', 'true');
			element.style.height = null;
			delete collapsesInProgress[id(element)];
		}, 500);
	});
}

/**
 * Collpases or uncollapses a DOM element
 * @param  {HTMLElement} element 	- DOM element to be (un)collapsed
 */
export function toggleCollapse(element, override) {
	if(typeof override !== 'undefined') {
		if(collapsesInProgress[id(element)]) {
			collapsesInProgress[id(element)]();
		}
		override ? uncollapse(element) : collapse(element); // eslint-disable-line no-unused-expressions
		return override;
	}

	if(collapsesInProgress[id(element)]) {
		collapsesInProgress[id(element)]();
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

export function showTab(targetTabEl) {
	let tablistEl = closest(targetTabEl, el => el.getAttribute('role') === 'tablist');
	let targetTabContainer = targetTabEl.parentElement;
	let tabs = tablistEl.querySelectorAll('li.zotero-tab');
	let tabpanelId = targetTabEl.getAttribute('aria-controls');
	let targetTabPanelEl = document.getElementById(tabpanelId);
	let tabPanelsWrapper = closest(targetTabPanelEl, el => el.classList.contains('zotero-tab-content'));
	let tabPanels = tabPanelsWrapper.querySelectorAll('.zotero-tabpanel');

	_.each(tabs, tabEl => {
		tabEl.classList.remove('zotero-tab-active');
		tabEl.querySelector('a').setAttribute('aria-selected', false);
	});
	_.each(tabPanels, tabPanelEl => {
		tabPanelEl.classList.remove('zotero-tabpanel-open');
		tabPanelEl.setAttribute('aria-expanded', false);
		tabPanelEl.setAttribute('aria-hidden', true);
	});

	targetTabContainer.classList.add('zotero-tab-active');
	targetTabPanelEl.classList.add('zotero-tabpanel-open');
	targetTabPanelEl.setAttribute('aria-expanded', true);
	targetTabPanelEl.setAttribute('aria-hidden', false);
	targetTabEl.setAttribute('aria-selected', true);
}

/**
 * Returns a fallback message for a clipboard
 * @return {String} 	- a fallback message
 */
export function clipboardFallbackMessage() {
	let actionMsg = '';

	if (/Mac/i.test(navigator.userAgent)) {
		actionMsg = 'Press ⌘-C to copy';
	}
	else {
		actionMsg = 'Press Ctrl-C to copy';
	}

	return actionMsg;
}

export function sanitizeURL(url) {
	url = url.trim();
	if(/^(https?|ftp):\/\//i.test(url)) {
		return url;
	} else {
		return `http://${url}`;
	}
}

const mappings = [
	[['&lt;b&gt;', '&lt;\/b&gt;'], ['<b>', '</b>']],
	[['&lt;i&gt;', '&lt;\/i&gt;'], ['<i>', '</i>']],
	[['&lt;sc&gt;', '&lt;\/sc&gt;'], ['<span class="small-caps">', '</span>']],
	[['&lt;sub&gt;', '&lt;\/sub&gt;'], ['<sub>', '</sub>']],
	[['&lt;sup&gt;', '&lt;\/sup&gt;'], ['<sup>', '</sup>']]
];

function recursiveBalancedMatch(mapping, value) {
	let matches = balanced(...mapping[0], value);
	if(matches) {
		return [
			recursiveBalancedMatch(mapping, matches.pre),
			mapping[1][0],
			recursiveBalancedMatch(mapping, matches.body),
			mapping[1][1],
			recursiveBalancedMatch(mapping, matches.post)
		].join('');
	} else {
		return value;
	}
}

export function escapeFormattedValue(value) {
	let escaped = _.escape(value);

	return mappings.reduce((value, mapping) => {
		return recursiveBalancedMatch(mapping, value);
	}, escaped);

}
