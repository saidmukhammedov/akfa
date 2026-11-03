import { ITranscriptionProvider, TranscriptionResult } from './transcription.types.js';
import { GoogleCloudSTTProvider } from './google-stt.provider.js';
import { MockSTTProvider } from './mock-stt.provider.js';
import { prisma } from '../prisma.js';

export class TranscriptionService {
  private static instance: TranscriptionService;
  private provider: ITranscriptionProvider;
  private mockProvider = new MockSTTProvider();

  constructor(provider?: ITranscriptionProvider) {
    if (provider) {
      this.provider = provider;
    } else if (
      process.env.NODE_ENV === 'test' ||
      (!process.env.GCP_SPEECH_API_KEY && !process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY)
    ) {
      this.provider = this.mockProvider;
    } else {
      this.provider = new GoogleCloudSTTProvider();
    }
  }

  static getInstance(): TranscriptionService {
    if (!TranscriptionService.instance) {
      TranscriptionService.instance = new TranscriptionService();
    }
    return TranscriptionService.instance;
  }

  setProvider(provider: ITranscriptionProvider) {
    this.provider = provider;
  }

  getMockProvider(): MockSTTProvider {
    return this.mockProvider;
  }

  useMockProvider() {
    this.provider = this.mockProvider;
  }

  async transcribe(
    audioBuffer: Buffer,
    mimeType: string = 'audio/webm'
  ): Promise<TranscriptionResult> {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Audio fayl bo'sh bo'lishi mumkin emas");
    }

    // 1. Fetch active worker names as domain vocabulary hints
    let workerNames: string[] = [];
    try {
      const workers = await prisma.worker.findMany({
        where: { status: 'ACTIVE' },
        select: { name: true },
      });
      workerNames = workers.map((w) => w.name);
    } catch {
      // In non-db test environments fallback gracefully
      workerNames = ['Jamshid Karimov', 'Sherzod Toirov', 'Bobur Usmonov', 'Jasur Saidov', 'Farrux Rahimov'];
    }

    const domainHints = [
      'obyom',
      'kvadrat',
      'kvadrat metr',
      'davomat',
      'ish haqi',
      'oylik',
      'kelmadi',
      'keldi',
      'yarim kun',
      'hisobot',
      'stavka',
      ...workerNames,
    ];

    return await this.provider.transcribe(audioBuffer, mimeType, domainHints);
  }
}

export const transcriptionService = TranscriptionService.getInstance();
