/**
 * Vision / Image Analysis Adapter
 *
 * Unified interface for AI-powered image understanding.
 *
 * Interface:
 *   vision.describe(fileUrl, options?) → Promise<string>
 *   vision.detectAnomalies(fileUrl, options?) → Promise<AnomalyResult>
 *   vision.classifyDamage(fileUrl, options?) → Promise<DamageReport>
 *   vision.compareBeforeAfter(beforeUrl, afterUrl) → Promise<string>
 *   vision.analyzeFloorPlan(fileUrl, options?) → Promise<object>    [future]
 */
import { base44 } from '@/api/base44Client';

/**
 * Generate a detailed description of an image.
 */
async function describe(fileUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: options.prompt ?? 'Describe this image in detail. Focus on construction or maintenance-relevant elements: materials, conditions, defects, measurements visible.',
    file_urls: [fileUrl],
    model: options.model ?? 'automatic',
  });
}

/**
 * Detect anomalies, defects, or issues in a construction/site photo.
 * Returns structured anomaly report.
 */
async function detectAnomalies(fileUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: options.prompt ?? `Analyze this construction/maintenance photo for anomalies.
Look for: cracks, water damage, mold, electrical issues, structural defects, improper installations, safety hazards.
Return JSON: { anomalies: [{type, severity, location, description, recommendation}], overall_condition: "good|fair|poor|critical", confidence: 0-1 }`,
    file_urls: [fileUrl],
    model: options.model ?? 'automatic',
    response_json_schema: options.schema ?? {
      type: 'object',
      properties: {
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              location: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
        },
        overall_condition: { type: 'string' },
        confidence: { type: 'number' },
      },
    },
  });
}

/**
 * Classify damage type and severity from a photo.
 */
async function classifyDamage(fileUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: 'Classify the damage visible in this photo. Return JSON: { damage_type, severity: "none|minor|moderate|severe|critical", affected_area, estimated_repair_complexity: "low|medium|high", urgent: boolean }',
    file_urls: [fileUrl],
    model: options.model ?? 'automatic',
    response_json_schema: {
      type: 'object',
      properties: {
        damage_type: { type: 'string' },
        severity: { type: 'string' },
        affected_area: { type: 'string' },
        estimated_repair_complexity: { type: 'string' },
        urgent: { type: 'boolean' },
      },
    },
  });
}

/**
 * Compare before and after photos of a work site.
 * Returns a summary of changes and completion assessment.
 */
async function compareBeforeAfter(beforeUrl, afterUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: options.prompt ?? 'Compare these two construction site photos (before and after). Describe: 1) What work was completed, 2) Quality of execution, 3) Anything incomplete or requiring attention, 4) Overall completion percentage estimate.',
    file_urls: [beforeUrl, afterUrl],
    model: options.model ?? 'automatic',
  });
}

/**
 * [STUB] Analyze a floor plan image to extract room dimensions and layout.
 * Requires Google Vision or specialized architecture AI.
 */
async function analyzeFloorPlan(fileUrl, options = {}) {
  return base44.integrations.Core.InvokeLLM({
    prompt: 'Analyze this floor plan. Extract: room names, estimated dimensions if visible, total area, number of rooms, special features (bathrooms, kitchen, balconies). Return as structured list.',
    file_urls: [fileUrl],
    model: options.model ?? 'automatic',
  });
}

export const vision = { describe, detectAnomalies, classifyDamage, compareBeforeAfter, analyzeFloorPlan };