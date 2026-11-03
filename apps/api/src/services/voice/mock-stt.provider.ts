import { ITranscriptionProvider, TranscriptionResult } from './transcription.types.js';

export class MockSTTProvider implements ITranscriptionProvider {
  name = 'mock-stt';
  private presetTranscript: string | null = null;

  setNextTranscript(transcript: string | null) {
    this.presetTranscript = transcript;
  }

  async transcribe(
    audioBuffer: Buffer,
    _mimeType: string,
    _vocabularyHints?: string[]
  ): Promise<TranscriptionResult> {
    if (this.presetTranscript) {
      const res = {
        transcript: this.presetTranscript,
        confidence: 0.98,
        detectedLanguage: 'uz-UZ',
        provider: this.name,
      };
      this.presetTranscript = null;
      return res;
    }

    // If audio buffer contains plain text string (useful in testing)
    const rawStr = audioBuffer.toString('utf-8');
    if (rawStr.startsWith('MOCK_VOICE:')) {
      return {
        transcript: rawStr.replace('MOCK_VOICE:', '').trim(),
        confidence: 0.99,
        detectedLanguage: 'uz-UZ',
        provider: this.name,
      };
    }

    return {
      transcript: 'Bugun Jamshid 25 kvadrat ishladi',
      confidence: 0.95,
      detectedLanguage: 'uz-UZ',
      provider: this.name,
    };
  }
}
