/*
Processes raw-ish data (i.e. scraped via the main script) into something more structured

Structure of data / types (for consistent naming of things):

raw data: [ Day ]
Day: { interactions: Interaction[] }
Interaction: [ Statement ]
Statement: { }
 */

const program = require('commander');
const JSONStream = require('JSONStream');
const debug = require('debug')('hansard-scraper');
const moment = require('moment');
const cheerio = require('cheerio');
const fs = require('fs');

program
	.option('-i --input <path>', 'JSON file to process')
	.option('-o, --output <path>', 'File to output to. Outputs to stdout if not specified')
	.parse(process.argv);

const transformStream = JSONStream.stringify();

if (program.output) {
	const outputStream = fs.createWriteStream(program.output);
	transformStream.pipe(outputStream);
} else {
	transformStream.pipe(process.stdout);
}

processData(program.input, transformStream);

function processData(path, destinationStream) {
	const transformStream = JSONStream.parse('*');
	const inputStream = fs.createReadStream(path);
	inputStream.pipe(transformStream).on('data', (data) => {
		const parsedDay = processDay(data);
		debug(parsedDay);
	}).on('end', () => {
		destinationStream.end();
	});
}

function processDay(dayData) {
	const date = parseDateString(dayData.date);
	const rawInteractions = dayData.interactions;
	const parsedInteractions = [];

	rawInteractions.forEach((rawInteraction) => {
		const parsedInteraction = {};

		parsedInteraction.statements = rawInteraction.map(processStatement);

		parsedInteractions.push(parsedInteraction);
	});

	return {
		date,
		interactions: parsedInteractions,
	};
}

function parseDateString(date) {
	let momentDate = moment.utc(date, 'D MMMM YYYY');
	return momentDate.format('YYYY-MM-DD');
}

function processStatement(rawStatement) {
	const rawContent = rawStatement.content;
	const rawContentDom = cheerio(rawContent);

	let fromName = '';
	let fromComplete = false;
	let toName = '';
	let toComplete = false;
	rawContentDom.each((i, c) => {
		let $c = cheerio(c);

		if (!fromComplete && isNameEnd($c)) {
			fromComplete = true;
			return;
		}

		if (!fromComplete) {
			fromName += $c.text();
			return;
		}

		if (!toComplete && isNameEnd($c)) {
			toComplete = true;
		}

		if (!toComplete) {
			toName += $c.text();
		}
	});

	return {
		from: fromName,
		to: toName,
		content: rawContent,
	};

	// parsedInteraction.from = fromName;
	// parsedInteraction.to = toName;
}

function tidyName(name) {
	return name.trim();
}

function isNameEnd($el) {
	let tagName = $el[0].name;

	return (tagName == null || tagName.toLowerCase() !== 'strong') && $el.text().trim() !== '';
}
