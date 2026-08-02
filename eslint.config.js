const jest = require('eslint-plugin-jest')

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      indent: [
        'error',
        2
      ],
      'max-len': [
        'error',
        80
      ],
      'operator-linebreak': [
        'error',
        'after',
        { 'overrides': { '?': 'before', ':': 'before' } }
      ],
      'linebreak-style': [
        'error',
        'unix'
      ],
      'quotes': [
        'error',
        'single'
      ],
      'semi': [
        'error',
        'never'
      ],
      'eol-last': [
        'error',
        'always'
      ],
      'no-fallthrough': [
        'error',
        { 'commentPattern': 'break[\\s\\w]*omitted' }
      ],
    },
  },
  {
    files: ['src/__test__/**/*.test.js'],
    plugins: {
      jest
    },
    languageOptions: {
      globals: jest.environments.globals.globals
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error',
      'jest/expect-expect': [
        'error',
        {
          'assertFunctionNames': ['expect', 'helper.agent.**.expect']
        }
      ]
    }
  }
]
