export function timeCaptions(scene, track) {
  const sentences = (scene.say || '').match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g)?.map(text => text.trim()).filter(Boolean) || [];
  if (!track) {
    scene.duration = Math.max(scene.duration, 1.5 * sentences.length);
    return sentences.map((text, i) => ({ text, start: scene.start + scene.duration * i / sentences.length }));
  }
  return sentences.map((text, i) => ({
    text,
    start: i === 0 ? scene.start : scene.audioAt + (track.sentences[i]?.start ?? track.duration * i / sentences.length),
  }));
}
