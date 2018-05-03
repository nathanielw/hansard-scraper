import test from 'ava';
import { extractContent } from '../result-parser';

// Extract content tests
const content = 'this is the content';

const contentCases = {
	basic: `<p class="SupQuestion"><strong>Jacinda Ardern</strong>: ${content}</p>`,
	splitStrongs: `<p class="SupQuestion"><strong>Jacinda</strong> <strong>Ardern</strong>: ${content}</p>`,
	noColon: `<p class="SupQuestion"><strong>Jacinda Ardern</strong> &#x2014; ${content}</p>`,
};

test('extractContent handles a basic case', t => {
	const extracted = extractContent(contentCases.basic);
	t.is(extracted, content);
});

test('extractContent handles multiple strong tags before the content', t => {
	const extracted = extractContent(contentCases.splitStrongs);
	t.is(extracted, content);
});

test('extractContent handles separators other than a colon', t => {
	const extracted = extractContent(contentCases.noColon);
	t.is(extracted, content);
});