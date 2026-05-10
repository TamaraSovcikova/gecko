module.exports = {
  root: true,
  ignorePatterns: ["node_modules/**", "dist/**", "coverage/**", ".vite/**"],
  env: {
    browser: true,
    es2022: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "no-console": "off",
  },
  overrides: [
    {
      files: ["**/*.test.{ts,tsx}"],
      env: {
        jest: true,
      },
    },
  ],
};
