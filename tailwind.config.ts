import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#C5A55A',
          navy: '#1B2845',
        },
      },
    },
  },
  plugins: [],
};

export default config;
