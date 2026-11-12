export default [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Array: "readonly",
        Error: "readonly",
        Float32Array: "readonly",
        Map: "readonly",
        Math: "readonly",
        Number: "readonly",
        Object: "readonly",
        Promise: "readonly",
        Set: "readonly",
        URLSearchParams: "readonly",
        console: "readonly",
        document: "readonly",
        performance: "readonly",
        requestAnimationFrame: "readonly",
        window: "readonly",
      },
    },
    rules: {
      eqeqeq: "error",
      "no-debugger": "error",
      "no-unused-vars": ["error", { args: "none" }],
      "no-undef": "error",
    },
  },
];
