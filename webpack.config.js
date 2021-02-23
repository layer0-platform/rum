const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const FileManagerPlugin = require('filemanager-webpack-plugin')
const plugins = []
const name = `v${require('./package.json').version}`

if (process.env.ANALYZE === 'true') {
  plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
    })
  )
}

module.exports = {
  target: 'web',
  entry: {
    [name]: './src/cdn.ts',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'cdn'),
  },
  plugins: [
    ...plugins,
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: path.resolve(__dirname, `cdn/${name}.js`),
              destination: path.resolve(__dirname, `cdn/latest.js`),
            },
          ],
        },
      },
    }),
  ],
}
