module.exports = {
    // Add you postcss configuration here
    // Learn more about it at https://github.com/webpack-contrib/postcss-loader#config-files
    plugins: [
      ['postcss-import'],
      ['tailwindcss'],
      ['autoprefixer'],
      // ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
    ],
  };