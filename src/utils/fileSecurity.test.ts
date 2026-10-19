/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedFileType,
  validateFileSize,
  formatFileSize,
  detectDoubleExtensionRisk,
  isValidSha256,
  MAX_FILE_SIZE_BYTES,
} from './fileSecurity.ts';

test('isSupportedFileType accepts recognized security file types and rejects unknown', () => {
  assert.equal(isSupportedFileType('sample.exe'), true);
  assert.equal(isSupportedFileType('DOCUMENT.PDF'), true);
  assert.equal(isSupportedFileType('archive.zip'), true);
  assert.equal(isSupportedFileType('malware.apk'), true);
  assert.equal(isSupportedFileType('library.dll'), true);
  assert.equal(isSupportedFileType('script.js'), true);
  assert.equal(isSupportedFileType('system.iso'), true);

  assert.equal(isSupportedFileType('audio.flac'), false);
  assert.equal(isSupportedFileType('unknown_file'), false);
  assert.equal(isSupportedFileType(''), false);
});

test('validateFileSize enforces positive size and maximum threshold', () => {
  const validSmall = validateFileSize(1024);
  assert.equal(validSmall.valid, true);

  const empty = validateFileSize(0);
  assert.equal(empty.valid, false);
  assert.match(empty.error || '', /empty/i);

  const oversized = validateFileSize(MAX_FILE_SIZE_BYTES + 100);
  assert.equal(oversized.valid, false);
  assert.match(oversized.error || '', /exceeds/i);
});

test('formatFileSize formats bytes cleanly into B, KB, and MB', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(10 * 1024 * 1024), '10.00 MB');
});

test('detectDoubleExtensionRisk flags deceptive executable disguises', () => {
  const invoiceTrap = detectDoubleExtensionRisk('invoice_payment_sept2026.pdf.exe');
  assert.equal(invoiceTrap.hasRisk, true);
  assert.match(invoiceTrap.warning || '', /masquerade/i);

  const docxTrap = detectDoubleExtensionRisk('resume.docx.vbs');
  assert.equal(docxTrap.hasRisk, true);

  const legitPdf = detectDoubleExtensionRisk('quarterly_report.pdf');
  assert.equal(legitPdf.hasRisk, false);

  const versionedFile = detectDoubleExtensionRisk('app.v1.0.zip');
  assert.equal(versionedFile.hasRisk, false);
});

test('isValidSha256 verifies standard 64-character hexadecimal hashes', () => {
  assert.equal(
    isValidSha256('2c2446132bb3522f741b7c06d3b8e23807768323860f4178ab0f31e33ccfe2a8'),
    true
  );
  assert.equal(isValidSha256('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'), true);
  assert.equal(isValidSha256('d41d8cd98f00b204e9800998ecf8427e'), false); // MD5 is 32 chars
  assert.equal(isValidSha256('not-a-hash'), false);
});
