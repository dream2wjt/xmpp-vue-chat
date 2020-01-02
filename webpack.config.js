var path = require('path')
var webpack = require('webpack')
var CleanWebpackPlugin = require('clean-webpack-plugin')

let external = {
  'vue': 'commonjs vue',
  'vuex': 'commonjs vuex',
  'vux': 'commonjs vux',
  // 'uih-emoji': 'commonjs uih-emoji',
  'strophe.js': 'commonjs strophe.js',
  './node_modules': 'commonjs ./node_modules'
}

module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, './distM'),
    publicPath: '/distM/',
    filename: 'uihchat.min.js',
    library: "UihChat",
    libraryTarget: "umd",
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ],
      },
      {
        test: /\.less$/,
        use: [{
          loader: 'vue-style-loader'
        },{
          loader: 'css-loader'
        },{
          loader: 'less-loader'
        }]
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    historyApiFallback: true,
    // noInfo: true,
    // https: true,
    // overlay: true
  },
  performance: {
    // hints: false
  },
  // devtool: '#source-map',
  externals: external
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new CleanWebpackPlugin(["distM"]),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1, // 必须大于或等于 1
      minChunkSize: 500
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
