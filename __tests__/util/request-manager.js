/* @flow */
/* eslint max-len: 0 */

import {OneTimePasswordError} from '../../src/errors.js';
import {Reporter} from '../../src/reporters/index.js';
import Config from '../../src/config.js';
import * as fs from '../../src/util/fs.js';

jest.setTimeout(60000);

const net = require('net');
const http = require('http');
const https = require('https');
const path = require('path');

test('RequestManager.request with cafile', async () => {
  let body;
  const options = {
    key: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-key.pem')),
    cert: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-cert.pem')),
  };
  const server = https.createServer(options, (req, res) => {
    res.end('ok');
  });
  try {
    server.listen(0);
    const config = await Config.create({
      cafile: path.join(__dirname, '..', 'fixtures', 'certificates', 'cacerts.pem'),
    });
    const port = server.address().port;
    body = await config.requestManager.request({
      url: `https://localhost:${port}/?nocache`,
      headers: {Connection: 'close'},
    });
  } finally {
    server.close();
  }
  expect(body).toBe('ok');
});

test('RequestManager.request with ca (string)', async () => {
  let body;
  const options = {
    key: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-key.pem')),
    cert: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-cert.pem')),
  };
  const server = https.createServer(options, (req, res) => {
    res.end('ok');
  });
  try {
    server.listen(0);
    const bundle = await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'cacerts.pem'));
    const hasPemPrefix = block => block.startsWith('-----BEGIN ');
    const caCerts = bundle.split(/(-----BEGIN .*\r?\n[^-]+\r?\n--.*)/).filter(hasPemPrefix);
    // the 2nd cert is valid one
    const config = await Config.create({ca: caCerts[1]});
    const port = server.address().port;
    body = await config.requestManager.request({
      url: `https://localhost:${port}/?nocache`,
      headers: {Connection: 'close'},
    });
  } finally {
    server.close();
  }
  expect(body).toBe('ok');
});

test('RequestManager.request with ca (array)', async () => {
  let body;
  const options = {
    key: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-key.pem')),
    cert: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-cert.pem')),
  };
  const server = https.createServer(options, (req, res) => {
    res.end('ok');
  });
  try {
    server.listen(0);
    const bundle = await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'cacerts.pem'));
    const hasPemPrefix = block => block.startsWith('-----BEGIN ');
    const caCerts = bundle.split(/(-----BEGIN .*\r?\n[^-]+\r?\n--.*)/).filter(hasPemPrefix);
    const config = await Config.create({ca: caCerts});
    const port = server.address().port;
    body = await config.requestManager.request({
      url: `https://localhost:${port}/?nocache`,
      headers: {Connection: 'close'},
    });
  } finally {
    server.close();
  }
  expect(body).toBe('ok');
});

test('RequestManager.request with mutual TLS', async () => {
  let body;
  const options = {
    key: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-key.pem')),
    cert: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-cert.pem')),
    ca: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'server-ca-cert.pem')),
    requestCert: true,
    rejectUnauthorized: true,
  };
  const server = https.createServer(options, (req, res) => {
    res.end('ok');
  });
  try {
    server.listen(0);
    const config = await Config.create({
      cafile: path.join(__dirname, '..', 'fixtures', 'certificates', 'server-ca-cert.pem'),
      key: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'client-key.pem')),
      cert: await fs.readFile(path.join(__dirname, '..', 'fixtures', 'certificates', 'client-cert.pem')),
    });
    const port = server.address().port;
    body = await config.requestManager.request({
      url: `https://localhost:${port}/?nocache`,
      headers: {Connection: 'close'},
    });
  } finally {
    server.close();
  }
  expect(body).toBe('ok');
});

// Real sockets retain the timeout/retry contract without coupling request's
// scheduling to an obsolete Jest fake-timer implementation.
for (const limit of [1, 5]) {
  test(`RequestManager.execute timeout error with maxRetryAttempts=${limit}`, async () => {
    let counter = 0;
    const sockets = new Set();
    const server = net.createServer(socket => {
      counter += 1;
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise(resolve => server.listen(0, resolve));
    try {
      const config = await Config.create({networkTimeout: 50});
      if (limit === 1) config.requestManager.setOptions({maxRetryAttempts: 1});
      await expect(config.requestManager.request({
        url: `http://localhost:${server.address().port}/?nocache`,
      })).rejects.toThrow('TIMEDOUT');
      expect(counter).toBe(limit);
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    }
  });
}

for (const statusCode of [403, 442]) {
  test(`RequestManager.execute Request ${statusCode} error`, async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(statusCode);
      res.end('');
    });
    await new Promise(resolve => server.listen(0, resolve));
    try {
      const config = await Config.create({}, new Reporter());
      const url = `http://localhost:${server.address().port}/?nocache`;
      await expect(config.requestManager.request({url})).rejects.toThrow(
        `${url}: Request "${url}" returned a ${statusCode}`,
      );
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
}

for (const endpoint of ['/yarn', '/-/user/org.couchdb.user:user']) {
  test(`RequestManager.execute one time password error on ${endpoint}`, async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(401, {'www-authenticate': 'otp', 'content-type': 'application/json'});
      res.end(JSON.stringify({ok: false, error: 'One-time password required'}));
    });
    await new Promise(resolve => server.listen(0, resolve));
    try {
      const config = await Config.create({});
      await expect(config.requestManager.request({
        url: `http://localhost:${server.address().port}${endpoint}`,
        json: true,
      })).rejects.toBeInstanceOf(OneTimePasswordError);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
}

// Exercise the actual HTTP client and its retry queue, including the real delay.
for (const statusCode of [408, 500, 542]) {
  test(`RequestManager.execute retries on ${statusCode} error`, async () => {
    let attempts = 0;
    const server = http.createServer((req, res) => {
      attempts += 1;
      res.writeHead(attempts < 3 ? statusCode : 200);
      res.end(attempts < 3 ? '<!DOCTYPE html><title>Rendering error</title>' : 'recovered');
    });
    await new Promise(resolve => server.listen(0, resolve));
    try {
      const config = await Config.create({}, new Reporter());
      await expect(config.requestManager.request({
        url: `http://localhost:${server.address().port}/?nocache`,
      })).resolves.toBe('recovered');
      expect(attempts).toBe(3);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
}

test('RequestManager.request with offlineNoRequests', async () => {
  const config = await Config.create({offline: true}, new Reporter());
  try {
    await config.requestManager.request({
      url: `https://localhost:port/?nocache`,
      headers: {Connection: 'close'},
    });
  } catch (err) {
    expect(err.message).toBe('Can\'t make a request in offline mode ("https://localhost:port/?nocache")');
  }
});

test('RequestManager.saveHar no captureHar error message', async () => {
  const config = await Config.create({captureHar: false}, new Reporter());
  try {
    config.requestManager.saveHar('testFile');
  } catch (err) {
    expect(err.message).toBe('RequestManager was not setup to capture HAR files');
  }
});
