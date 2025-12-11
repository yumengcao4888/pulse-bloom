import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const config = [
  {
    ignores: ['generated/**/*'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default config;
