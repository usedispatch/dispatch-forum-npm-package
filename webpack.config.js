const webpack = require('webpack');
const path = require('path');
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
        test: /\.svg$/,
        // issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
        type:'asset/inline',
      },
      {        
        test: /\.css$/i,        
        include: path.resolve(__dirname, 'src'),        
        use: ['style-loader', 'css-loader', 'postcss-loader'],      
      },
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
    },
    assetModuleFilename: 'assets/[name].svg',
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
