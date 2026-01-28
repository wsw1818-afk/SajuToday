// Jest 설정 파일
// 테스트 환경 설정

// 글로벌 __DEV__ 변수 설정
global.__DEV__ = true;

// 콘솔 경고 무시 (테스트 중 불필요한 경고 방지)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated:') || args[0].includes('componentWillReceiveProps'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};
