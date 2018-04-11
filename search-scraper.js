const request = require('request-promise-native');
const cheerio = require('cheerio');
const debug = require('debug')('hansard-scraper');

const BASE_URL = 'https://www.parliament.nz';

const START_PATH = '/en/ajax/hansardlisting/search/6227?Criteria.Timeframe=range&Criteria.ViewAll=1&Criteria.Dt[0].Tick=false&Criteria.Dt[0].Value=Hansard - event&Criteria.Dt[1].Tick=true&Criteria.Dt[1].Value=Hansard - question&Criteria.Dt[2].Tick=false&Criteria.Dt[2].Value=Hansard - speech&Criteria.Dt[3].Tick=false&Criteria.Dt[3].Value=Hansard - vote&Criteria.ViewDetails=1';

const requestOptions = {
	baseUrl: BASE_URL,
	transform(body) {
		return cheerio.load(body);
	},
};

// Downloads Question Time transcripts as HTML
function fetchResultPages(dateFrom, dateTo, destinationStream) {
	let url = `${START_PATH}&Criteria.DateFrom=${dateFrom}&Criteria.DateTo=${dateTo}`;

	return request(url, requestOptions).catch(err => {
		debug(err);
	}).then(($) => {
		let resultTable = $('.table--list tbody');
		return destinationStream.write(resultTable.html());
	});
}

module.exports = {
	fetchResultPages,
};
