const path = require("path");

module.exports = {
  entry: "./src/index.js", // Adjust if your entry point is different
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true, // Cleans old builds
  },
  mode: "production", // Use "development" for local builds
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader", // Optional: if using ES6+
        },
      },
    ],
  },
  resolve: {
    extensions: [".js"],
  },
};
