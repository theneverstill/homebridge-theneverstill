module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:json/recommended",
    "plugin:prettier/recommended",
    "prettier",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ],
  overrides: [
    {
      files: ["src/**/*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    {
      files: ["*.spec.js", "*.spec.ts"],
      rules: {
        "max-lines": "off",
        "max-params": "off",
        "max-statements": "off",
        "no-global-assign": "off",
        "no-undefined": "off",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint",
    "import",
    "jsdoc",
    "prettier",
    "prefer-arrow",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "(h|Host)",
      },
    ],
    "arrow-body-style": ["error", "as-needed"],
    complexity: "error",
    "max-depth": "error",
    "max-lines": "error",
    "max-params": ["error", 3],
    "max-statements": "error",
    "max-statements-per-line": "error",
    "no-console": ["warn"], // use the provided Homebridge log method instead
    "no-unsafe-finally": "error",
    "prefer-arrow/prefer-arrow-functions": [
      "error",
      {
        disallowPrototype: true,
        singleReturnOnly: true,
        classPropertiesAllowed: false,
      },
    ],
    "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
    "prettier/prettier": "error",
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};
