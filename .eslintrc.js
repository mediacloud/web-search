module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "settings": {
        "version": "detect"
    },
    "rules": {
        "semi": ["error", "always"],
        "react/prop-types": ["off"],
        "no-unused-vars": ["warn"],
        "react/no-unescaped-entities": ["warn"]
    }
};
