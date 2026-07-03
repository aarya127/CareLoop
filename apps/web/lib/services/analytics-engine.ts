/**
 * Analytics engine stub — extracts KPIs from a call transcript.
 * Real implementation would use NLP / an AI model.
 */

export interface TreatmentAcceptance {
  accepted: boolean;
  procedure?: string;
}

export interface TranscriptKpis {
  sentimentScore: number;
  satisfactionByProvider: Record<string, number>;
  treatmentAcceptance: TreatmentAcceptance;
  riskFlags: string[];
}

export function extractKpisFromTranscript(transcript: string): TranscriptKpis {
  return {
    sentimentScore: 0,
    satisfactionByProvider: {},
    treatmentAcceptance: { accepted: false },
    riskFlags: [],
  };
}
