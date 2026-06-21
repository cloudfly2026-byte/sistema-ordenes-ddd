import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['../src/**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/../src/domain/$1',
    '^@application/(.*)$': '<rootDir>/../src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/../src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/../src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/../src/shared/$1',
  },
};

export default config;

