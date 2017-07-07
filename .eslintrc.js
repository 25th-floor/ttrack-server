module.exports = {
    "extends": [
        "airbnb",
    ],
    'parser': 'babel-eslint',
    'env': {
        'jest': true,
        "es6": true,
        "node": true,
    },
    'rules': {
        'no-use-before-define': 0,
        'no-console': [1, { allow: ["error", "info"] }],
        "indent": [2, 4, { "SwitchCase": 1 }],
        "class-methods-use-this": 0,
        "import/no-extraneous-dependencies": 0,
        "max-len": ["error", 125, 4,
            {
                "ignoreUrls": true,
                "ignoreComments": false,
                "ignoreStrings": true,
                "ignoreTemplateLiterals": true
            }
        ],
        "jsx-a11y/no-static-element-interactions": "off",
        "no-mixed-operators": "off",
        "no-plusplus": "off"
    }
};