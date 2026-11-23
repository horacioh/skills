import fs from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export async function narrate(dir, text, voice, rate) {
  fs.mkdirSync(dir, { recursive: true });
  for (let attempt = 0; ; attempt++) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {
        sentenceBoundaryEnabled: true,
        wordBoundaryEnabled: true,
      });
      const { audioFilePath, metadataFilePath } = await tts.toFile(dir, text, { rate });
      const { Metadata } = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
      const boundaries = Metadata.filter(x => ['SentenceBoundary', 'WordBoundary'].includes(x.Type)).map(x => ({
        type: x.Type,
        text: x.Data.text.Text,
        start: x.Data.Offset / 1e7,
        end: (x.Data.Offset + x.Data.Duration) / 1e7,
      }));
      if (!boundaries.length || !fs.statSync(audioFilePath).size) throw new Error('No speech or timing data received');
      return { audioFilePath, boundaries };
    } catch (error) {
      if (attempt === 3) throw new Error('Could not generate narration. Check internet access and the voice, or rerun with --silent.', { cause: error });
    } finally {
      tts.close();
    }
    await setTimeout(2000 * (attempt + 1));
  }
}
