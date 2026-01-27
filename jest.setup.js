// Jest setup file
// Mock react-native modules
const mockReactNative = {
  Platform: {
    OS: 'ios',
    select: jest.fn((dict) => dict.ios),
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  Modal: 'Modal',
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Switch: 'Switch',
  Linking: {
    openURL: jest.fn(),
  },
};

// Mock i18next
const mockI18next = {
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  I18nextProvider: ({ children }) => children,
};

// Mock react-native-localize
const mockLocalize = {
  getLocales: () => [{ languageCode: 'en' }],
};

// Export react-native mock by default
module.exports = mockReactNative;

// Set up mocks for jest.mock calls
if (typeof jest !== 'undefined') {
  jest.mock('react-i18next', () => mockI18next);
  jest.mock('react-native-localize', () => mockLocalize);
}
