import next from 'eslint-config-next'

const config = [
  ...next,
  {
    rules: {
      // Tailor linting to current code style without fighting className strings.
      'react/jsx-no-bind': 'off',
    },
  },
]

export default config
