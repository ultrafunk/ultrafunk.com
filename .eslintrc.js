module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 9,
    "sourceType": "module"
  },
  "rules": {
    "semi": ["error", "always"],
    "eqeqeq": ["error", "always", {"null": "always"}]
  },
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true,
    "jquery": true
  },
};
