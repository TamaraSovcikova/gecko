module.exports = {
  root: true,
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.vite/**",
  ],
  env: {
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  overrides: [
    {
      files: ["client/src/**/*.{ts,tsx}"],
      env: {
        browser: true,
        es2022: true,
      },
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ["@typescript-eslint"],
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: ["server/**/*.js", "*.js"],
      excludedFiles: ["client/**"],
      env: {
        node: true,
        es2022: true,
      },
      extends: ["eslint:recommended"],
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["**/*.test.{js,ts,tsx}"],
      env: {
        jest: true,
      },
    },
  ],
};
