// Configuracion de jest aislada para backend/scripts (D9 de 77-jev-quality-backtest).
// La configuracion principal vive en package.json con "rootDir": "src", asi que no
// recoge nada de este directorio. Se corre con `pnpm test:scripts`.
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: __dirname,
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/../tsconfig.json' },
    ],
  },
  testEnvironment: 'node',
};
