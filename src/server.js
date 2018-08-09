import 'isomorphic-fetch';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import express from 'express';
import graphQLHTTP from 'express-graphql';
import { getFarceResult } from 'found/lib/server';
import { Resolver } from 'found-relay';
import ReactDOMServer from 'react-dom/server';
import RelayServerSSR from 'react-relay-network-modern-ssr/lib/server';
import serialize from 'serialize-javascript';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import createRelayEnvironment from './createRelayEnvironment';
import { historyMiddlewares, render, routeConfig } from './router';
import schema from './data/schema';

const PORT = 8080;

const app = express();

app.use('/graphql', graphQLHTTP({ schema }));

const webpackConfig = {
  mode: 'development',

  entry: ['babel-polyfill', 'isomorphic-fetch', './src/clientjs', 'webpack-hot-middleware/client'],

  output: {
    path: '/',
    filename: 'bundle.js',
  },

  resolve: {
    extensions: [
      ".graphql.js",
      ".web.js",
      ".web.ts",
      ".web.tsx",
      ".js",
      ".jsx",
      ".json",
      ".ts",
      ".tsx",
      ".mjs",
    ],
  },

  module: {
    rules: [
      // See https://github.com/aws/aws-amplify/issues/686#issuecomment-387710340.
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      { test: /\.ts|\.tsx|\.js|\.jsx$/, exclude: /node_modules/, use: 'babel-loader' },
    ],
  },

  plugins: [
    new CopyWebpackPlugin([
      'src/assets',
      'node_modules/todomvc-common/base.css',
      'node_modules/todomvc-app-css/index.css',
    ]),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],

  devtool: 'cheap-module-source-map',
};

const webpackCompiler = webpack(webpackConfig);
app.use(
  webpackDevMiddleware(webpackCompiler, {
    stats: { colors: true },
  }),
);

app.use(
  webpackHotMiddleware(webpackCompiler, {})
);

app.use(async (req, res) => {
  const relaySsr = new RelayServerSSR();

  const { redirect, status, element } = await getFarceResult({
    url: req.url,
    historyMiddlewares,
    routeConfig,
    resolver: new Resolver(
      createRelayEnvironment(relaySsr, `http://localhost:${PORT}/graphql`),
    ),
    render,
  });

  if (redirect) {
    res.redirect(302, redirect.url);
    return;
  }

  const appHtml = ReactDOMServer.renderToString(element);
  const relayData = await relaySsr.getCache();

  res.status(status).send(`
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Relay • TodoMVC</title>
  <link rel="stylesheet" href="base.css">
  <link rel="stylesheet" href="index.css">
</head>

<body>
<div id="root">${appHtml}</div>

<script>
  window.__RELAY_PAYLOADS__ = ${serialize(relayData, { isJSON: true })};
</script>
<script src="/bundle.js"></script>
</body>

</html>
  `);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`); // eslint-disable-line no-console
});
