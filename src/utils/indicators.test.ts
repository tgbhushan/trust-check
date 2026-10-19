/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getVirusTotalUrlId,
  validateUrl,
  validateDomain,
  validateIp,
  validateFileHash,
  detectSensitiveIndicators,
  calculateAssessmentCategory,
  maskIndicator,
  extractHostname,
  queryGoogleDnsOverHttps,
  queryGoogleSafeBrowsing,
} from './indicators.ts';

test('getVirusTotalUrlId generates URL-safe unpadded base64 identifier', () => {
  const url = 'https://example.com/';
  const vtId = getVirusTotalUrlId(url);
  // Base64 of 'https://example.com/' is 'aHR0cHM6Ly9leGFtcGxlLmNvbS8='
  // With '=' removed, it should be 'aHR0cHM6Ly9leGFtcGxlLmNvbS8'
  assert.equal(vtId.includes('='), false);
  assert.equal(vtId, 'aHR0cHM6Ly9leGFtcGxlLmNvbS8');
});

test('validateUrl accepts standard HTTPS and HTTP URLs and blocks embedded credentials', () => {
  const validHttps = validateUrl('https://example.com/path?arg=1');
  assert.equal(validHttps.valid, true);
  assert.equal(validHttps.normalized, 'https://example.com/path?arg=1');

  const withCreds = validateUrl('https://admin:secret123@example.com');
  assert.equal(withCreds.valid, false);
  assert.match(withCreds.error || '', /credentials/i);

  const invalidScheme = validateUrl('ftp://example.com/file.zip');
  assert.equal(invalidScheme.valid, false);
});

test('validateDomain rejects invalid hostnames and IP addresses', () => {
  const validDomain = validateDomain('sub.example.com');
  assert.equal(validDomain.valid, true);
  assert.equal(validDomain.normalized, 'sub.example.com');

  const urlInDomain = validateDomain('https://example.com/test');
  assert.equal(urlInDomain.valid, true);
  assert.equal(urlInDomain.normalized, 'example.com');

  const ipInDomain = validateDomain('192.168.1.1');
  assert.equal(ipInDomain.valid, false);
});

test('validateIp detects valid IPv4 and IPv6 and flags private RFC 1918 IPs', () => {
  const publicIpv4 = validateIp('8.8.8.8');
  assert.equal(publicIpv4.valid, true);
  assert.equal(publicIpv4.isPrivate, false);

  const privateIpv4 = validateIp('192.168.1.100');
  assert.equal(privateIpv4.valid, true);
  assert.equal(privateIpv4.isPrivate, true);

  const loopback = validateIp('127.0.0.1');
  assert.equal(loopback.valid, true);
  assert.equal(loopback.isPrivate, true);

  const ipv6 = validateIp('2001:4860:4860::8888');
  assert.equal(ipv6.valid, true);

  const invalid = validateIp('999.999.999.999');
  assert.equal(invalid.valid, false);
});

test('validateFileHash accepts valid 64-character SHA-256 and rejects invalid', () => {
  const validSha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const check = validateFileHash(validSha);
  assert.equal(check.valid, true);

  const shortHash = validateFileHash('d41d8cd98f00b204e9800998ecf8427e'); // MD5
  assert.equal(shortHash.valid, false);
});

test('detectSensitiveIndicators flags auth tokens, passwords, and private IPs', () => {
  const resetUrl = 'https://bank.example.com/reset?token=xyz987654321&user=john';
  const sensitiveCheck = detectSensitiveIndicators(resetUrl, 'url');
  assert.equal(sensitiveCheck.isSensitive, true);
  assert.match(sensitiveCheck.reason, /tokens|credentials/i);
  assert.equal(sensitiveCheck.sanitizedSuggestion?.includes('token='), false);

  const privateIpCheck = detectSensitiveIndicators('10.0.0.5', 'ip');
  assert.equal(privateIpCheck.isSensitive, true);

  const cleanUrl = 'https://news.example.com/article/tech-update';
  const cleanCheck = detectSensitiveIndicators(cleanUrl, 'url');
  assert.equal(cleanCheck.isSensitive, false);
});

test('calculateAssessmentCategory enforces transparent evidence classification', () => {
  assert.equal(calculateAssessmentCategory({ malicious: 3, suspicious: 0, harmless: 40, undetected: 30 }), 'malicious');
  assert.equal(calculateAssessmentCategory({ malicious: 0, suspicious: 2, harmless: 40, undetected: 30 }), 'suspicious');
  assert.equal(calculateAssessmentCategory({ malicious: 0, suspicious: 0, harmless: 40, undetected: 30 }), 'no_detections');
  assert.equal(calculateAssessmentCategory({ malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }), 'inconclusive');
  assert.equal(calculateAssessmentCategory(undefined), 'inconclusive');
});

test('maskIndicator protects sensitive query parameters in display', () => {
  const masked = maskIndicator('https://example.com/auth?token=supersecretkey&id=123', 'url');
  assert.equal(masked.includes('supersecretkey'), false);
  assert.equal(masked.includes('••••••••'), true);
});

test('extractHostname extracts domain cleanly from URLs and domains', () => {
  assert.equal(extractHostname('https://sub.example.com/page?query=1', 'url'), 'sub.example.com');
  assert.equal(extractHostname('example.org', 'domain'), 'example.org');
  assert.equal(extractHostname('https://EXAMPLE.NET/', 'url'), 'example.net');
});

test('queryGoogleDnsOverHttps resolves public domains and detects NXDOMAIN', async () => {
  const resolved = await queryGoogleDnsOverHttps('google.com');
  assert.equal(resolved.status, 'resolved');
  assert.equal(resolved.statusCode, 0);
  assert.ok(Array.isArray(resolved.ipAddresses) && resolved.ipAddresses.length > 0);

  const nxdomain = await queryGoogleDnsOverHttps('definitely-nonexistent-domain-test-trustcheck-123.org');
  assert.equal(nxdomain.status, 'nxdomain');
  assert.equal(nxdomain.statusCode, 3);
});

test('queryGoogleSafeBrowsing handles unconfigured and placeholder keys honestly', async () => {
  const unconfigured = await queryGoogleSafeBrowsing('https://google.com/', '');
  assert.equal(unconfigured.status, 'not_configured');
  assert.equal(unconfigured.configured, false);
  assert.ok(unconfigured.message.includes('not configured'));

  const placeholder = await queryGoogleSafeBrowsing('https://google.com/', 'MY_SAFE_BROWSING_API_KEY');
  assert.equal(placeholder.status, 'not_configured');
  assert.equal(placeholder.configured, false);
});

