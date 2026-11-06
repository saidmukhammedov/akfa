import { ITranscriptionProvider, TranscriptionResult } from './transcription.types.js';
import { mergeOverlappingChunks } from '@akfa/shared';

/**
 * Google Cloud Speech-to-Text Provider (Chirp 2 / V2 API with uz-UZ support).
 * Falls back to Google Gemini Multimodal Audio if GEMINI_API_KEY is configured
 * and GCP_SPEECH_API_KEY is omitted, providing maximum deployability.
 */
export class GoogleCloudSTTProvider implements ITranscriptionProvider {
  name = 'google-cloud-speech-chirp2';

  private apiKey = process.env.GCP_SPEECH_API_KEY || process.env.GOOGLE_API_KEY || '';
  private projectId = process.env.GCP_PROJECT_ID || '';
  private geminiKey = process.env.GEMINI_API_KEY || '';

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    vocabularyHints: string[] = []
  ): Promise<TranscriptionResult> {
    // 1. If Google Cloud Speech API Key or Credentials are provided:
    if (this.apiKey) {
      try {
        const result = await this.transcribeViaGcpSpeech(audioBuffer, mimeType, vocabularyHints);
        if (result && result.transcript) {
          return result;
        }
      } catch (err: any) {
        console.warn('[GoogleCloudSTTProvider] GCP Speech failed, attempting fallback:', err.message);
      }
    }

    // 2. If Gemini API key is available, use multimodal Gemini audio recognition with uz-UZ prompt
    if (this.geminiKey) {
      try {
        const result = await this.transcribeViaGemini(audioBuffer, mimeType, vocabularyHints);
        if (result && result.transcript) {
          return result;
        }
      } catch (err: any) {
        console.warn('[GoogleCloudSTTProvider] Gemini Audio STT failed:', err.message);
      }
    }

    // 3. Fallback: If no external cloud credentials are configured, return meaningful fallback or error
    if (!this.apiKey && !this.geminiKey) {
      throw new Error(
        "Google Cloud Speech API kaliti (GCP_SPEECH_API_KEY yoki GEMINI_API_KEY) server sozlamalarida topilmadi. Iltimos, .env faylida sozlang."
      );
    }

    throw new Error("Ovozni matnga aylantirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
  }

  private async transcribeViaGcpSpeech(
    audioBuffer: Buffer,
    mimeType: string,
    vocabularyHints: string[]
  ): Promise<TranscriptionResult> {
    // Determine encoding based on mimeType
    let encoding = 'WEBM_OPUS';
    let sampleRateHertz = 48000;
    if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) {
      encoding = 'MP3';
      sampleRateHertz = 44100;
    } else if (mimeType.includes('wav')) {
      encoding = 'LINEAR16';
      sampleRateHertz = 16000;
    }

    // Google Cloud Speech REST API (Chirp 2 / Standard V1/V2 recognize endpoint)
    const url = `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`;
    const payload = {
      config: {
        encoding: mimeType.includes('webm') ? 'WEBM_OPUS' : undefined,
        languageCode: 'uz-UZ',
        model: 'chirp_2',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        speechContexts: [
          {
            phrases: [
              'obyom',
              'kvadrat',
              'kvadrat metr',
              'davomat',
              'ish haqi',
              'oylik',
              'kelmadi',
              'keldi',
              'yarim kun',
              'bosh usta',
              'shogird',
              'stavka',
              'hisobot',
              ...vocabularyHints,
            ],
            boost: 15.0,
          },
        ],
      },
      audio: {
        content: audioBuffer.toString('base64'),
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Speech API HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const chunks: string[] = data.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      ?.filter(Boolean)
      ?.map((t: string) => t.trim()) || [];

    let transcript = '';
    for (const chunk of chunks) {
      transcript = mergeOverlappingChunks(transcript, chunk);
    }
    transcript = transcript.trim();

    const confidence = data.results?.[0]?.alternatives?.[0]?.confidence ?? 0.92;

    return {
      transcript,
      confidence,
      detectedLanguage: 'uz-UZ',
      provider: 'google-cloud-speech-chirp2',
    };
  }

  private async transcribeViaGemini(
    audioBuffer: Buffer,
    mimeType: string,
    vocabularyHints: string[]
  ): Promise<TranscriptionResult> {
    const cleanMime = mimeType.split(';')[0] || 'audio/webm';
    const base64Audio = audioBuffer.toString('base64');

    const promptText = `Ushbu audio yozuvdagi o'zbek tilidagi nutqni aniq matnga aylantirib ber.
Faqat eshitilgan so'zlarni o'zbekcha lotin imlosida yoz.
Qo'shimcha izoh yoki tushuntirish yozma.
Domain vocabulary konteksti: obyom, kvadrat metr, davomat, keldi, kelmadi, maosh, hisobot, ${vocabularyHints.join(', ')}.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini STT API HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return {
      transcript: rawText,
      confidence: 0.95,
      detectedLanguage: 'uz-UZ',
      provider: 'google-gemini-multimodal-stt',
    };
  }
}
