module.exports = {
	'rules': {
		'indent': [
			2,
			'tab'
		],
		'quotes': [
			2,
			'single'
		],
		'linebreak-style': [
			2,
			'unix'
		],
		'semi': [
			2,
			'always'
		],
		'camelcase': [
			2,
			{'properties': 'always'}
		],
		'brace-style': [
			2,'1tbs',
			{'allowSingleLine': true}
		],
		'no-trailing-spaces': [
			2,
			{'skipBlankLines': true}
		],
		'comma-dangle': [
			2,
			'always-multiline',
		],
	},
	'env': {
		'es6': true,
		'node': true,
	},
	'parserOptions': {
		'ecmaVersion': 6,
		'sourceType': 'module'
	},
	'extends': 'eslint:recommended'
};
