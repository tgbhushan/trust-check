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
  evaluateMultiProviderVerdict,
  areIndicatorsEquivalent,
  validateReportTarget,
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

test('one detection among many clean results yields conflicting verdict rather than definitive malware', () => {
  // Scenario: 1 vendor (Fortra) flags phishing on https://google.com/, while 92 engines do not flag
  const singleDetectionCategory = calculateAssessmentCategory({
    malicious: 1,
    suspicious: 0,
    harmless: 70,
    undetected: 22,
  });
  assert.equal(singleDetectionCategory, 'conflicting');

  const verdict = evaluateMultiProviderVerdict({
    stats: { malicious: 1, suspicious: 0, harmless: 70, undetected: 22 },
    engines: [
      { engine_name: 'Fortra', category: 'malicious', result: 'phishing', method: 'signature' },
      { engine_name: 'Google Safebrowsing', category: 'harmless', result: 'clean', method: 'signature' },
    ],
    safeBrowsingEvidence: {
      status: 'safe',
      configured: true,
      message: 'No active threat match listed.',
    },
  });

  assert.equal(verdict.assessment, 'conflicting');
  assert.match(verdict.assessment_summary, /Conflicting evidence: 1 security vendor flagged this URL/i);
  assert.match(verdict.assessment_summary, /Fortra: phishing/i);
  assert.match(verdict.assessment_summary, /should neither be treated as definitive malware nor dismissed as safe/i);
  assert.ok(verdict.warnings.some((w) => w.includes('isolated vendor flagged')));
});

test('multiple independent detections corroborate definitive malicious assessment', () => {
  // Multiple VT engines flag malicious
  const multiVtCategory = calculateAssessmentCategory({
    malicious: 3,
    suspicious: 0,
    harmless: 50,
    undetected: 10,
  });
  assert.equal(multiVtCategory, 'malicious');

  // Corroboration across independent providers (1 VT vendor + Google Safe Browsing)
  const crossProviderVerdict = evaluateMultiProviderVerdict({
    stats: { malicious: 1, suspicious: 0, harmless: 60, undetected: 10 },
    engines: [
      { engine_name: 'AlphaEngine', category: 'malicious', result: 'trojan', method: 'signature' },
    ],
    safeBrowsingEvidence: {
      status: 'threat_found',
      configured: true,
      matches: [{ threatType: 'MALWARE', platformType: 'ANY' }],
      message: 'Active threat found.',
    },
  });
  assert.equal(crossProviderVerdict.assessment, 'malicious');
  assert.match(crossProviderVerdict.assessment_summary, /Multiple independent threat intelligence providers/i);

  // Purely independent multi-engine VT report
  const multiEngineVerdict = evaluateMultiProviderVerdict({
    stats: { malicious: 2, suspicious: 1, harmless: 40, undetected: 20 },
    engines: [
      { engine_name: 'VendorA', category: 'malicious', result: 'malware', method: 'signature' },
      { engine_name: 'VendorB', category: 'malicious', result: 'phishing', method: 'signature' },
    ],
  });
  assert.equal(multiEngineVerdict.assessment, 'malicious');
  assert.match(multiEngineVerdict.assessment_summary, /Multiple independent security vendors/i);
});

test('conflicting provider results are transparently labeled and explained', () => {
  // Google Safe Browsing flags active threat match, but 80 VT engines report zero detections
  const conflictingVerdict = evaluateMultiProviderVerdict({
    stats: { malicious: 0, suspicious: 0, harmless: 60, undetected: 20 },
    safeBrowsingEvidence: {
      status: 'threat_found',
      configured: true,
      matches: [{ threatType: 'SOCIAL_ENGINEERING', platformType: 'ANY' }],
      message: 'Google Safe Browsing threat match.',
    },
  });

  assert.equal(conflictingVerdict.assessment, 'conflicting');
  assert.match(conflictingVerdict.assessment_summary, /Conflicting provider evidence/i);
  assert.match(conflictingVerdict.assessment_summary, /SOCIAL_ENGINEERING/i);
  assert.match(conflictingVerdict.assessment_summary, /80 VirusTotal engines reported no detections/i);
  assert.ok(conflictingVerdict.warnings.some((w) => w.includes('Google Safe Browsing flagged active threat')));
});

test('Google Safe Browsing and DNS results remain strictly independent', () => {
  // Domain NXDOMAIN does not overwrite clean Safe Browsing or vice-versa
  const independentVerdict = evaluateMultiProviderVerdict({
    stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 },
    safeBrowsingEvidence: {
      status: 'safe',
      configured: true,
      message: 'No threat listed in Safe Browsing.',
    },
    dnsEvidence: {
      status: 'nxdomain',
      domain: 'does-not-exist.example',
      statusCode: 3,
      message: 'Domain not found in authoritative DNS (NXDOMAIN)',
    },
  });

  // NXDOMAIN flags anomaly without falsely fabricating a malicious blacklist hit
  assert.equal(independentVerdict.assessment, 'suspicious');
  assert.ok(independentVerdict.warnings.some((w) => w.includes('NXDOMAIN')));
});

test('stale-result prevention validates matching target indicators and rejects cross-query pollution', () => {
  // URL equivalence handling canonical variations
  assert.equal(areIndicatorsEquivalent('https://google.com', 'https://google.com/', 'url'), true);
  assert.equal(areIndicatorsEquivalent('https://GOOGLE.COM/test', 'https://google.com/test', 'url'), true);
  assert.equal(areIndicatorsEquivalent('https://google.com/search', 'https://google.com/about', 'url'), false);
  assert.equal(areIndicatorsEquivalent('https://google.com', 'https://phishing-google.com', 'url'), false);

  // Domain equivalence
  assert.equal(areIndicatorsEquivalent('google.com', 'https://google.com/', 'domain'), true);
  assert.equal(areIndicatorsEquivalent('example.com', 'example.org', 'domain'), false);

  // Validate report target freshness
  const matchResult = validateReportTarget('https://google.com', 'https://google.com/', 'url');
  assert.equal(matchResult.valid, true);

  const staleResult = validateReportTarget('https://google.com', 'https://malicious-scam.example/', 'url');
  assert.equal(staleResult.valid, false);
  assert.match(staleResult.reason || '', /Stale results blocked/i);
});


