module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 11,
    "sourceType": "module"
  },
  "rules": {
    "semi": ["error", "always"],
    "eqeqeq": ["error", "always", {"null": "always"}]
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
