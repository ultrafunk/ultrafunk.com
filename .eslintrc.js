module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 11,
    "sourceType": "module"
  },
  "rules": {
    "semi": ["error", "always"],
    "eqeqeq": ["error", "always", {"null": "always"}],
    "no-var": 2,
    "prefer-const": ["error"],
    "default-param-last": ["error"],
    "no-label-var": ["error"],
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
};
