export interface SSECallbacks {
  onContent: (content: string) => void;
  onSessionId: (sessionId: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function parseSSEStream(
  response: Response,
  callbacks: SSECallbacks
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error("No response body"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") {
          callbacks.onDone();
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) callbacks.onContent(parsed.content);
          if (parsed.session_id) callbacks.onSessionId(parsed.session_id);
        } catch {
          // Non-JSON data — treat as raw content
          callbacks.onContent(data);
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
