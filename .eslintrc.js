module.exports = {
    parser: "@typescript-eslint/parser",
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    plugins: ["@typescript-eslint"],
    env: {
        node: true,
    },
    rules: {
    },
    ignorePatterns: ["node_modules", "dist"],
};
