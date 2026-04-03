const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    background: "./src/background/service-worker.ts",
    content: "./src/content/content-script.ts",
    popup: "./src/popup/popup.ts",
    sidepanel: "./src/sidepanel/sidepanel.ts",
    notespanel: "./src/notespanel/notespanel.ts",
    options: "./src/options/options.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/[name].js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name]/[name].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "icons", to: "icons" },
        { from: "src/popup/popup.html", to: "popup/popup.html" },
        { from: "src/sidepanel/sidepanel.html", to: "sidepanel/sidepanel.html" },
        { from: "src/notespanel/notespanel.html", to: "notespanel/notespanel.html" },
        { from: "src/options/options.html", to: "options/options.html" },
        { from: "fonts", to: "fonts" },
      ],
    }),
  ],
  devtool: "cheap-module-source-map",
};
