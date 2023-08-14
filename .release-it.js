// monorepo release: https://cloud.tencent.com/developer/article/2231241
const options = {
  git: {
    // ref: https://github.com/release-it/release-it/blob/master/lib/plugin/git/Git.js
    addUntrackedFiles: true,
    commitMessage: 'chore: release v${version}',
    tagMatch: '[0-9]*',
  },
  github: {
    release: false,
    // config github token
    tokenRef: 'GH_TOKEN',
  },
  gitlab: {
    release: false,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'angular',
      infile: 'CHANGELOG.md',
    },
  },
  npm: {
    // publish with ci/cd
    publish: false,
  },
  hooks: {
    'after:release': 'echo Successfully released ${name} v${version} to ${repo.repository}.',
  },
};

module.exports = options;
