import react from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "BackendFuncs/**"],
  },
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
    },
  },
];

export default config;
