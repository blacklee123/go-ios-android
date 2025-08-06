import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'unicorn/prefer-node-protocol': 0,
    'no-console': 1,
  },
})
