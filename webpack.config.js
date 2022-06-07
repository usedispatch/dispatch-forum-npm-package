const webpack = require('webpack');
const path = require('path');
module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  mode:'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve('buffer'),
        },
        symlinks: false
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library:{
        name: "@usedispatch/forum",
        type:'umd',
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
  ],
  externals: {
    react: 'react',
    reactDOM: 'react-dom',
    'react/jsx-runtime': 'react/jsx-runtime',
  }
}
