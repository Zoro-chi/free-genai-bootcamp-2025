/**
 * TTS Service - Client for interacting with the YarnGPT TTS service
 */

// Base URL for the TTS service - should come from environment variables
const TTS_SERVICE_URL =
  process.env.NEXT_PUBLIC_YARN_TTS_SERVICE_URL || "http://localhost:8000";

/**
 * Generate speech from text using YarnGPT TTS service
 *
 * @param {string} text - The text to convert to speech
 * @param {string} language - The language of the text (english, yoruba, igbo, pidgin)
 * @param {string} speaker - The speaker voice to use
 * @returns {Promise<{audioUrl: string, cached: boolean}>} - Response containing audio URL
 */
export async function generateSpeech(
  text,
  language = "english",
  speaker = "idera"
) {
  try {
    const response = await fetch(`${TTS_SERVICE_URL}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        language,
        speaker_name: speaker,
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(`TTS API error: ${error.detail || response.statusText}`);
    }

    const result = await response.json();
    return {
      audioUrl: `${TTS_SERVICE_URL}${result.audioUrl}`,
      cached: result.cached,
      duration: result.audioDuration,
    };
  } catch (error) {
    console.error("TTS service error:", error);
    throw error;
  }
}

/**
 * Map Bible language code to YarnGPT language code and speaker
 */
export function mapLanguageToTTS(language) {
  switch (language) {
    case "yoruba":
      return { language: "yoruba", speaker: "yoruba_male2" };
    case "igbo":
      return { language: "igbo", speaker: "igbo_male1" };
    case "pidgin":
      return { language: "pidgin", speaker: "pidgin_male1" };
    default:
      return { language: "english", speaker: "idera" };
  }
}
