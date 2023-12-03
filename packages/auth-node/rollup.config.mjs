import baseConfigs from '../../rollup.config.mjs';

const configs = {
  ...baseConfigs,
  input: ['src/index.ts', 'src/edge.ts'],
};

export default configs;
