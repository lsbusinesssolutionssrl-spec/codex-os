/**
 * OCR Adapter
 *
 * Unified interface for extracting text from images and documents.
 *
 * Interface:
 *   ocr.extractText(fileUrl, options?) → Promise<string>
 *   ocr.extractStructured(fileUrl, schema, options?) → Promise<object>
 *   ocr.extractFromPhoto(fileUrl, options?) → Promise<string>
 */
import { base44 } from '@/api/base44Client';

/**
 * Extract plain text from an image or PDF.
 * Currently uses Base44 LLM Vision (GPT-4o with file_urls).
 */
async function extractText(fileUrl, options = {}) {
  const provider = options.provider ?? 'base44_llm_vision';

  if (provider === 'base44_llm_vision') {
    return base44.integrations.Core.InvokeLLM({
      prompt: options.prompt ?? 'Extract all text from this document. Return the raw text exactly as it appears, preserving structure. No commentary.',
      file_urls: [fileUrl],
      model: options.model ?? 'automatic',
    });
  }

  if (provider === 'google_document_ai') {
    // TODO: invoke backend function `googleOCR`
    // Requires: GOOGLE_CLOUD_KEY, Document AI processor ID
    throw new Error('Google Document AI not yet activated. Create googleOCR backend function.');
  }

  if (provider === 'azure_form_recognizer') {
    // TODO: invoke backend function `azureOCR`
    throw new Error('Azure Form Recognizer not yet activated. Create azureOCR backend function.');
  }

  throw new Error(`Unknown OCR provider: ${provider}`);
}

/**
 * Extract structured data from a document using a JSON schema.
 * Currently uses Base44 ExtractDataFromUploadedFile integration.
 */
async function extractStructured(fileUrl, schema, options = {}) {
  const provider = options.provider ?? 'base44_llm_vision';

  if (provider === 'base44_llm_vision') {
    return base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: schema,
    });
  }

  throw new Error(`Structured extraction not yet implemented for provider: ${provider}`);
}

/**
 * Quick text extraction from a construction site photo.
 * Useful for reading labels, measurements, product codes on site.
 */
async function extractFromPhoto(fileUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: options.prompt ?? 'Read any visible text in this photo: labels, measurements, model numbers, product codes, signs. List them clearly.',
    file_urls: [fileUrl],
    model: 'automatic',
  });
}

export const ocr = { extractText, extractStructured, extractFromPhoto };