const request = require('request-promise-native');
const cheerio = require('cheerio');
const program = require('commander');
const JSONStream = require('JSONStream');
const debug = require('debug')('hansard-scraper');
const fs = require('fs');

const PATH = '/en/pb/hansard-debates/rhr/?criteria.Timeframe=365.00%3A00%3A00.000';
const BASE_URL = 'https://www.parliament.nz';
const REQUEST_SPACING = 500;
const DATE_REGEX = /\d+\s+\w+\s+\d+/;

const requestOptions = {
	baseUrl: BASE_URL,
	transform(body) {
		return cheerio.load(body);
	},
};

program
	.option('-p --path <path>', 'URL to the page to parse')
	.option('-s --single', 'Parse a single page then stop')
	.option('-o, --output <path>', 'File to output to. Outputs to stdout if not specified')
	.parse(process.argv);

const transformStream = JSONStream.stringify();

if (program.output) {
	const outputStream = fs.createWriteStream(program.output);
	transformStream.pipe(outputStream);
} else {
	transformStream.pipe(process.stdout);
}

if (program.single && program.path) {
	parseTranscriptPage(program.path).then((result) => {
		transformStream.write(result);
		transformStream.end();
	});
	process.exit();
}

parseSite(PATH, transformStream).then(() => {
	transformStream.end();
});

function parseSite(path, destinationStream) {
	return parseListingPage(path, []).then((links) => {
		const transcriptPagePromises = [];

		let delay = 0;

		links.forEach((link) => {
			const p = new Promise((resolve) => {
				// Space out the requests since the server seems to be doing some filtering
				setTimeout(() => {
					resolve(parseTranscriptPage(link).then((result) => {
						destinationStream.write(result);
					}));
				}, delay);
			});

			delay += REQUEST_SPACING;
			transcriptPagePromises.push(p);
		});

		return Promise.all(transcriptPagePromises);
	});
}

function parseListingPage(url, accumulatedLinks) {
	return request(url, requestOptions).catch(err => {
		debug(err);
	}).then(($) => {
		const transcriptLinkEls = $('.hansard__list-item h2.hansard__heading > a');

		transcriptLinkEls.each((i, el) => {
			accumulatedLinks.push($(el).attr('href'));
		});

		const nextUrl = $('.pagination__next > a').attr('href');

		if (nextUrl != null) {
			return parseListingPage(nextUrl, accumulatedLinks);
		}

		return accumulatedLinks;
	});
}

function parseTranscriptPage(url) {
	return request(url, requestOptions).catch(err => {
		debug(err);
	}).then(($) => {
		const interactions = $('.hansard__level .section');
		const pageHeading = $('h1');
		const dateMatch = DATE_REGEX.exec(pageHeading.text());

		if (dateMatch == null) {
			debug('No date found');
			return;
		}

		const date = dateMatch[0];
		const processedInteractions = [];

		interactions.each((i, interaction) => {
			const question = $('.SubsQuestion', interaction);
			if (question.length <= 0) {
				return;
			}
			const lines = $('p', interaction);
			const processedLines = [];
			let reachedQuestion = false;

			lines.each((j, line) => {
				line = $(line);

				if (!reachedQuestion) {
					reachedQuestion = line.hasClass('SubsQuestion');

					if (!reachedQuestion) {
						return;
					}
				}

				processedLines.push({
					content: line.html(),
					class: line.attr('class'),
				});
			});
			processedInteractions.push(processedLines);
		});

		return {
			date,
			interactions: processedInteractions,
		};
	});
}
