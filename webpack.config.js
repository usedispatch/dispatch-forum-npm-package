const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  mode:'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {        
        test: /\.css$/i,        
        include: path.resolve(__dirname, 'src'),        
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],  
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve('buffer'),
            crypto: require.resolve('crypto-browserify'), 
            stream: require.resolve('stream-browserify'),
            path: require.resolve('path-browserify'),
            zlib: require.resolve('browserify-zlib'),
            assert: require.resolve('assert'),
        },
        symlinks: false
  },
  output: {
    publicPath: 'auto',
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    library:{
        name: "@usedispatch/forum",
        type:'umd',
    },
    globalObject: 'this',
    // assetModuleFilename: 'assets/[name].svg',
  },
  plugins: [
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new MiniCssExtractPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
  externals: {
    react: 'react',
    reactDOM: 'react-dom',
    'react/jsx-runtime': 'react/jsx-runtime',
  }
}
