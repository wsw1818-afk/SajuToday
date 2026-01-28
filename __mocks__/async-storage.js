// @react-native-async-storage/async-storage 모킹
let mockStorage = {};

module.exports = {
  setItem: jest.fn((key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockStorage[key] || null);
  }),
  removeItem: jest.fn((key) => {
    delete mockStorage[key];
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => delete mockStorage[key]);
    return Promise.resolve();
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => {
      mockStorage[key] = value;
    });
    return Promise.resolve();
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map((key) => [key, mockStorage[key] || null]));
  }),
  clear: jest.fn(() => {
    mockStorage = {};
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(mockStorage));
  }),
  // 테스트 유틸리티
  __resetMockStorage: () => {
    mockStorage = {};
  },
  __getMockStorage: () => mockStorage,
};
