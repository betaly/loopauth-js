module.exports = {
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "no-extra-boolean-cast": "off",
        "no-prototype-builtins": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-floating-promises": "off",
      }
    }
  ]
};
