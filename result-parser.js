const cheerio = require('cheerio');
const debug = require('debug')('hansard-scraper');

const DATE_REGEX = /\d{2}-\w*?-\d{4}/;
const TITLE_REGEX = /^(Rt Hon|Hon Dr|Dr|Hon)\s/;
const QUESTION_NO_REGEX = /^\d*\./;
const INTERACTION_TYPES = {
	'SubsQuestion': 'question-initial',
	'SubsAnswer': 'answer-initial',
	'SupQuestion': 'question-sup',
	'SupAnswer': 'answer-sup',
	'Interjection': 'interjection',
	'ContinueSpeech': 'speech-coninue',
	'ContinueAnswer': 'answer-continue',
	'Speech': 'speech',
	'Intervention': 'intervention',
};

const INTERACTION_CLASSES = Object.keys(INTERACTION_TYPES);

const IGNOREABLE_CLASSES = [
	'BeginningOfDay',
	'IndentMarginalone',
	'QOA',
	'QOAEnd',
	'QType',
	'QTypealone',
	'a',
];

// Takes HTML data from the Hansard website, parses it and outputs the parsed data as JSON
function parseResults(htmlData, destinationStream) {

	const $ = cheerio.load(htmlData);
	const interactionEls = $('.list__row td');

	interactionEls.each((i, el) => {
		const interaction = {
			statements: [],
		};

		const body = $('div.body-text .section', el);

		// Extract date
		const headingText = $('h2', el).text();
		const dateMatch = DATE_REGEX.exec(headingText);

		if (dateMatch == null) {
			debug('No date found');
			return;
		}

		interaction.date = dateMatch[0];

		// Extract initial question asker
		let askerNameText = $('p.SubsQuestion > strong', body).text(); // The name sometimes gets separated across multiple <strong> tags
		askerNameText = askerNameText.substring(askerNameText.indexOf('.') + 1).trim();
		interaction.asker = extractName(askerNameText);

		// Extract initial question answerer
		const answererNameText = $('p.SubsAnswer > strong', body).text();
		interaction.answerer = extractName(answererNameText);

		const statementEls = $('.section > p', body);
		statementEls.each((i, statementEl) => {
			statementEl = $(statementEl);
			let elementClass;

			const willParse = INTERACTION_CLASSES.some((className) => {
				if(statementEl.hasClass(className)) {
					elementClass = className;
					return true;
				}

				return false;
			});

			if (!willParse) {
				if (!IGNOREABLE_CLASSES.includes(statementEl.attr('class'))) {
					debug(`ignoring statement type ${statementEl.attr('class')}`);
				}
				return;
			}

			const nameText = $('strong', statementEl).text().trim();
			const name = extractName(nameText);
			interaction.statements.push({
				speaker: name,
				content: statementEl.text().split(':')[1].trim(),
				type: INTERACTION_TYPES[elementClass],
			});
		});

		destinationStream.write(interaction);
	});

	return Promise.resolve();
}

function extractName(text) {
	text = text.trim();
	text = text.replace(QUESTION_NO_REGEX, '').trim();
	text = text.replace(TITLE_REGEX, '').trim();

	const roleStart = text.indexOf('(');

	if (roleStart > 0) {
		text = text.substring(0, roleStart).trim();
	}

	return text.toLowerCase();
}

module.exports = {
	parseResults,
};
