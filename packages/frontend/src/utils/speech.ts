/**
 * Web Speech API 封装
 * 不支持时抛出错误，由调用方降级处理
 */

export function speak(text: string, lang = "en-US"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("SpeechSynthesis not supported"));
      return;
    }

    // 取消当前正在播放的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // 稍慢，适合学习

    // Chrome 已知 bug：onend/onerror 有时不触发，加超时兜底
    // 超时时间 = 文本字数 × 平均朗读速度 + 缓冲
    const timeout = Math.max(5000, text.length * 200 + 2000);
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(); // 超时不报错，静默结束
      }
    }, timeout);

    utterance.onend = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };

    utterance.onerror = (e) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        // Chrome 在某些情况下报 "interrupted" 但不影响体验，也 resolve
        if (e.error === "interrupted" || e.error === "canceled") {
          resolve();
        } else {
          reject(new Error(`Speech error: ${e.error}`));
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
