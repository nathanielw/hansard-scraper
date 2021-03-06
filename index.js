const program = require('commander');
const JSONStream = require('JSONStream');
const fs = require('fs');

const fetchResultPages = require('./search-scraper').fetchResultPages;
const parseResults = require('./result-parser').parseResults;

program
	.command('fetch')
	.option('-t --to <yyyy-mm-dd>', 'Date to end on')
	.option('-f --from <yyyy-mm-dd>', 'Date to start from')
	.option('-o, --output <path>', 'File to output to. Outputs to stdout if not specified')
	.action((cmd) => {
		let outputStream;

		if (cmd.output) {
			outputStream = fs.createWriteStream(cmd.output);
		} else {
			outputStream = process.stdout;
		}

		fetchResultPages(cmd.from, cmd.to, outputStream).then(() => {
			if (process.stdout !== outputStream) {
				outputStream.end();
			}
		});
	});

program.command('parse <file>')
	.option('-o, --output <path>', 'File to output to. Outputs to stdout if not specified')
	.action((file, cmd) => {
		const transformStream = JSONStream.stringify();

		if (cmd.output) {
			const outputStream = fs.createWriteStream(cmd.output);
			transformStream.pipe(outputStream);
		} else {
			transformStream.pipe(process.stdout);
		}

		let htmlData = fs.readFileSync(file, 'utf8');
		return parseResults(htmlData, transformStream).then(() => {
			transformStream.end();
		});
	});

program.parse(process.argv);
