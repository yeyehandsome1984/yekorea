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

  // Speak the text
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
