/**
 * Text-to-Speech utility for Korean pronunciation
 * Uses Web Speech API with Korean language support
 */

export const speakKorean = (text: string): void => {
  // Check if browser supports Web Speech API
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create speech utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR'; // Korean language
  utterance.rate = 0.9; // Slightly slower for learning
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Workaround for Chrome bug - voices may not be loaded yet
  const voices = window.speechSynthesis.getVoices();
  const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  // Chrome sometimes pauses after cancel() - add small delay
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 50);
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
