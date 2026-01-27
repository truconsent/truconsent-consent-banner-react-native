// Mock for react-i18next moduleNameMapper
module.exports = {
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  I18nextProvider: ({ children }) => children,
};

