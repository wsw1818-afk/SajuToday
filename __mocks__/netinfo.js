// @react-native-community/netinfo 모킹
module.exports = {
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {
        isConnectionExpensive: false,
      },
    })
  ),
  configure: jest.fn(),
};
