const path = require("path");

module.exports = {
  target: "node", // Ensures compatibility with Node.js environment
  entry: "./src/index.js", // Adjust if your entry file is elsewhere
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true, // Clears old builds
  },
  mode: "production", // Use "development" for local debugging
  resolve: {
    extensions: [".js"],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader", // Optional: only if using ES6+ syntax
        },
      },
    ],
  },
  externals: {
    express: "commonjs express",
    fs: "commonjs fs",
    dotenv: "commonjs dotenv",
    axios: "commonjs axios",
  },
};
