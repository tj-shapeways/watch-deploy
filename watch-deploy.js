#!/usr/bin/env node

const chokidar = require('chokidar');
const _ = require('lodash');
const Rsync = require('rsync');
const moment = require('moment');
const clc = require('cli-color');
const emoji = require('node-emoji');
const fs = require('fs');

const configRaw = fs.readFileSync('./.config');
const config = JSON.parse(configRaw);

const infoMessage = function infoMessage(text) {
  console.log(emoji.emojify(':loudspeaker:\t') + (text || ''));
};

const doneMessage = function doneMessage(greenText, text) {
  console.log(emoji.emojify('\n:+1:\t' + clc.green(greenText) + '\t\t') + (text || '') + '\n');
};

const logMessage = function logMessage(text) {
  console.log('\n\t' + (text || '') + '\n');
};

const syncFiles = function syncFiles() {
  infoMessage('Syncing files');
  const rsync = new Rsync()
    .flags('av')
    .source(config.localFolder)
    .destination(config.env + ':' + config.remoteFolder)
    .delete();
  if (config.exclude) {
    rsync.exclude(config.exclude);
  }
  logMessage(rsync.command());
  rsync.execute((err) => {
    if (err) throw err;
    doneMessage('Success','Last sync at ' + moment().format('h:mm:ss A') + '.');
  }, (data) => {
    console.log(data.toString('utf8').trim());
  });
};

const watchFiles = function watchFiles() {
  chokidar.watch(config.localFolder, {
    // ignore .dotfiles
    ignored: /(^|[\/\\])\../
  }).on('ready', () => {
    infoMessage('Watching all files in ' + config.localFolder);
  }).on('all', _.debounce(syncFiles, 500));
};


// Make sure this is a dev environment in the form `dev***.nyc.shapeways.net` or `username@dev***.nyc.shapeways.net`
if (config.env.indexOf('dev') !== 0 && config.env.indexOf('@dev') === -1) {
  throw new Error('This script can only be used to deploy to a development environment.')
} else {
  watchFiles();
}
