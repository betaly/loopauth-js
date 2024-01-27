import baseConfigs from '../../rollup.config.mjs';

const configs = {
  ...baseConfigs,
  input: ['src/index.ts', 'src/edge.ts', 'src/server-actions.ts'],
};

export default configs;
