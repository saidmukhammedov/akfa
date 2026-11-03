export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  detectedLanguage: string;
  provider: string;
}

export interface ITranscriptionProvider {
  name: string;
  transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    vocabularyHints?: string[]
  ): Promise<TranscriptionResult>;
}
