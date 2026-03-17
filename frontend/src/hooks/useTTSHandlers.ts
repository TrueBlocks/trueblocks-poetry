import { notifications } from "@mantine/notifications";
import { SpeakWord } from "@wailsjs/go/services/TTSService";
import { LogInfo, LogError } from "@wailsjs/runtime/runtime.js";
import { db } from "@models";

export function useTTSHandlers(
  stopAudio: () => void,
  currentAudioRef: React.MutableRefObject<HTMLAudioElement | null>,
) {
  const handlePronounce = async (entity: db.Entity) => {
    stopAudio();

    notifications.show({
      id: "tts-loading",
      title: "Generating pronunciation...",
      message: "Querying OpenAI",
      color: "blue",
      loading: true,
      autoClose: false,
    });
    try {
      const result = await SpeakWord(
        entity.primaryLabel,
        entity.typeSlug,
        entity.primaryLabel,
        entity.id,
      );
      LogInfo(
        `Received TTS result, cached: ${result.cached}, error: ${result.error || "none"}`,
      );

      if (result.error) {
        notifications.update({
          id: "tts-loading",
          title: "TTS Error",
          message: result.error,
          color: "red",
          loading: false,
          autoClose: result.errorType === "missing_key" ? false : 5000,
          withCloseButton: true,
        });
        return;
      }

      if (result.cached) {
        notifications.update({
          id: "tts-loading",
          title: "Using cached audio",
          message: "Playing from cache",
          color: "green",
          loading: false,
          autoClose: 1500,
        });
      } else {
        notifications.hide("tts-loading");
      }

      const audioData = result.audioData;

      let uint8Array: Uint8Array;
      if (typeof audioData === "string") {
        const binaryString = atob(audioData);
        uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
      } else if (audioData instanceof Uint8Array) {
        uint8Array = audioData;
      } else if (Array.isArray(audioData)) {
        uint8Array = new Uint8Array(audioData);
      } else {
        throw new Error("Unexpected audio data format");
      }

      LogInfo(`Converted to Uint8Array, length: ${uint8Array.length}`);
      const blob = new Blob([uint8Array as BlobPart], {
        type: "audio/mpeg",
      });
      LogInfo(`Created blob, size: ${blob.size}`);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      currentAudioRef.current = audio;

      audio.onerror = (e) => {
        LogError(`Audio playback error: ${JSON.stringify(e)}`);
        notifications.show({
          title: "Playback Error",
          message: "Failed to play audio",
          color: "red",
        });
        currentAudioRef.current = null;
      };

      await audio.play();
      LogInfo("Audio playing...");
      audio.onended = () => {
        LogInfo("Audio playback completed");
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      notifications.update({
        id: "tts-loading",
        title: "Error",
        message: errorMessage,
        color: "red",
        loading: false,
        autoClose: 3000,
      });
      LogError(`Failed to generate pronunciation: ${error}`);
    }
  };

  const handleReadQuote = async (entity: db.Entity) => {
    stopAudio();

    const quoteRegex = /\[\s*\n([\s\S]*?)\n\s*\]/;
    const match = entity?.description?.match(quoteRegex);
    if (!match || !match[1]) {
      notifications.show({
        title: "No Quote Found",
        message: "Could not find quoted text",
        color: "orange",
      });
      return;
    }

    let quotedText = match[1].replace(/[\\\/]$/gm, "").trim();

    const primaryLabelCount = quotedText.split(/\s+/).length;

    if (primaryLabelCount < 500) {
      if (quotedText.length > 4000) {
        quotedText = quotedText.substring(0, 4000);
      }
    } else {
      const stanzas = quotedText.split(/\n\s*\n/);

      let selectedText = stanzas[0] || "";
      let lineCount = selectedText.split("\n").length;

      let stanzaIndex = 1;
      while (lineCount < 5 && stanzaIndex < stanzas.length) {
        const nextStanza = stanzas[stanzaIndex];
        const combined = selectedText + "\n\n" + nextStanza;

        if (combined.length > 4000) break;

        selectedText = combined;
        lineCount = selectedText.split("\n").length;
        stanzaIndex++;
      }

      quotedText = selectedText.trim();
    }

    const textToSpeak = `${entity.primaryLabel}. ${quotedText}`;

    const finalText =
      textToSpeak.length > 4000 ? textToSpeak.substring(0, 4000) : textToSpeak;

    notifications.show({
      id: "tts-quote-loading",
      title: "Generating speech...",
      message: "Querying OpenAI",
      color: "blue",
      loading: true,
      autoClose: false,
    });

    try {
      const result = await SpeakWord(
        finalText,
        entity?.typeSlug || "",
        entity?.primaryLabel || "",
        entity.id,
      );
      LogInfo(
        `Received quote TTS result, cached: ${result.cached}, error: ${result.error || "none"}`,
      );

      if (result.error) {
        notifications.update({
          id: "tts-quote-loading",
          title: "TTS Error",
          message: result.error,
          color: "red",
          loading: false,
          autoClose: result.errorType === "missing_key" ? false : 5000,
          withCloseButton: true,
        });
        return;
      }

      if (result.cached) {
        notifications.update({
          id: "tts-quote-loading",
          title: "Using cached audio",
          message: "Playing from cache",
          color: "green",
          loading: false,
          autoClose: 1500,
        });
      } else {
        notifications.hide("tts-quote-loading");
      }

      const audioData = result.audioData;

      let uint8Array: Uint8Array;
      if (typeof audioData === "string") {
        const binaryString = atob(audioData);
        uint8Array = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
      } else if (audioData instanceof Uint8Array) {
        uint8Array = audioData;
      } else if (Array.isArray(audioData)) {
        uint8Array = new Uint8Array(audioData);
      } else {
        throw new Error("Unexpected audio data format");
      }

      LogInfo(`Converted quote to Uint8Array, length: ${uint8Array.length}`);
      const blob = new Blob([uint8Array as BlobPart], {
        type: "audio/mpeg",
      });
      LogInfo(`Created quote blob, size: ${blob.size}`);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      currentAudioRef.current = audio;

      audio.onerror = (e) => {
        LogError(`Quote audio playback error: ${JSON.stringify(e)}`);
        notifications.show({
          title: "Playback Error",
          message: "Failed to play audio",
          color: "red",
        });
        currentAudioRef.current = null;
      };

      await audio.play();
      LogInfo("Quote audio playing...");
      audio.onended = () => {
        LogInfo("Quote audio playback completed");
        URL.revokeObjectURL(url);
        currentAudioRef.current = null;
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      LogError(`Failed to generate quote speech: ${errorMessage}`);
      LogError(`Full error: ${JSON.stringify(error)}`);
      notifications.update({
        id: "tts-quote-loading",
        title: "Error",
        message: errorMessage || "Failed to generate speech",
        color: "red",
        loading: false,
        autoClose: 5000,
      });
    }
  };

  return { handlePronounce, handleReadQuote };
}
