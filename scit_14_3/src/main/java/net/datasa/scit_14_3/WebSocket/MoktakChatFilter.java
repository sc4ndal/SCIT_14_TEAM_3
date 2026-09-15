package net.datasa.scit_14_3.WebSocket;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MoktakChatFilter {
	
	private static final int MAX_LENGTH = 60;
	private static final long COOLDOWN_MS = 1500;
	
	private static final List<String> BANNED_WORDS = Arrays.asList(
			"시발", "씨발", "개새끼", "병신"
	);
	
	private final Map<String, Long> lastSentAt = new ConcurrentHashMap<>();
	
	public FilterResult filter(String sessionId, String rawText) {
		if (rawText == null) return FilterResult.blocked();
		
		String text = rawText.trim();
		if(text.isEmpty()) return FilterResult.blocked();
		if(text.length() > MAX_LENGTH) text = text.substring(0, MAX_LENGTH);
		
		long now = System.currentTimeMillis();
		Long last = lastSentAt.get(sessionId);
		if(last != null && (now - last) < COOLDOWN_MS) {
			return FilterResult.blocked();
		}
		lastSentAt.put(sessionId, now);
		
		return FilterResult.allowed(maskBannedWords(text));
	}
	
	private String maskBannedWords(String text) {
		String result = text;
		for (String word : BANNED_WORDS) {
			if(word.isEmpty()) continue;
			result = result.replace(word, "*".repeat(word.length()));
		}
		return result;
	}
	
	public static class FilterResult {
		private final boolean allowed;
		private final String filteredText;
		
		private FilterResult(boolean allowed, String filteredText) {
			this.allowed = allowed;
			this.filteredText = filteredText;
		}
		
		public static FilterResult allowed(String text) { return new FilterResult(true, text); }
		public static FilterResult blocked() { return new FilterResult(false, null); }
		public boolean isAllowed() { return allowed; }
		public String getFilteredText() { return filteredText; }
	}

}
