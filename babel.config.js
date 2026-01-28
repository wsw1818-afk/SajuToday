module.exports = function(api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    // Jest 환경에서는 기본 preset만 사용 (reanimated 없이)
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    };
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
