const request = require('request-promise-native');
const cheerio = require('cheerio');
const debug = require('debug')('hansard-scraper');

const BASE_URL = 'https://www.parliament.nz';

const START_PATH = '/en/ajax/hansardlisting/search/6227?criteria.Keyword=&criteria.Dt[0].Tick=false&criteria.Dt[0].Value=Hansard+-+event&criteria.Dt[1].Tick=true&criteria.Dt[1].Tick=false&criteria.Dt[1].Value=Hansard+-+question&criteria.Dt[2].Tick=false&criteria.Dt[2].Value=Hansard+-+speech&criteria.Dt[3].Tick=false&criteria.Dt[3].Value=Hansard+-+vote&criteria.Timeframe=&criteria.DateFrom=&criteria.DateTo=&criteria.ParliamentNumber=-1&criteria.MemberOfParliament=&criteria.Portfolio=&X-Requested-With=XMLHttpRequest&Criteria.ViewDetails=1&Criteria.ViewAll=1';

const requestOptions = {
	baseUrl: BASE_URL,
	transform(body) {
		return cheerio.load(body);
	},
};

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
