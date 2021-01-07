/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { rollup } from 'rollup';
import fs from 'fs-extra';
import { copy } from '@web/rollup-plugin-copy';

import { createMpaConfig } from '@rocket/building-rollup';
import { addPlugin, adjustPluginOptions } from 'plugins-manager';

/**
 * @param {object} config
 */
async function buildAndWrite(config) {
  const bundle = await rollup(config);

  if (Array.isArray(config.output)) {
    await bundle.write(config.output[0]);
    await bundle.write(config.output[1]);
  } else {
    await bundle.write(config.output);
  }
}

async function productionBuild(config) {
  const defaultSetupPlugins = [
    addPlugin({
      name: 'copy',
      plugin: copy,
      options: {
        patterns: ['!(*.md|*.html)*', '_merged_assets/_static/**/*.{png,gif,jpg,json,css,svg,ico}'],
        rootDir: config.outputDevDir,
      },
    }),
  ];
  if (config.pathPrefix) {
    defaultSetupPlugins.push(
      adjustPluginOptions('html', { absolutePathPrefix: config.pathPrefix }),
    );
  }

  const mpaConfig = createMpaConfig({
    input: '**/*.html',
    output: {
      dir: config.outputDir,
    },
    // custom
    rootDir: config.outputDevDir,
    absoluteBaseUrl: config.absoluteBaseUrl,
    setupPlugins: [
      ...defaultSetupPlugins,
      ...config.setupDevAndBuildPlugins,
      ...config.setupBuildPlugins,
    ],
  });

  await buildAndWrite(mpaConfig);
}

export class RocketBuild {
  commands = ['build'];

  setupCommand(config) {
    config.watch = false;
    return config;
  }

  async setup({ config }) {
    this.config = {
      emptyOutputDir: true,
      ...config,
    };
  }

  async build() {
    if (this.config.emptyOutputDir) {
      await fs.emptyDir(this.config.outputDir);
    }
    await productionBuild(this.config);
  }
}