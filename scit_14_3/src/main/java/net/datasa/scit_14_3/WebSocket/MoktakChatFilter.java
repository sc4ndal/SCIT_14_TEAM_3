package net.datasa.scit_14_3.WebSocket;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class MoktakChatFilter {

	private static final int MAX_LENGTH = 60;
	private static final long COOLDOWN_MS = 1500;

	// 한국어 욕설/비속어, 성적 표현(섹드립), 영어/일본어 욕설 포함. maskBannedWords()가 특수문자/숫자를
	// 무시하고 매칭하므로("시@발", "시1발"도 "시발"로 걸림) 여기엔 우회용 변형(자모 분리, 초성 등)을
	// 따로 안 넣어도 된다 - 순수 단어 형태만 등록.
	private static final List<String> BANNED_WORDS = Arrays.asList(
			// 한국어 - 욕설/비속어
			"시발", "씨발", "씨팔", "시팔", "ㅅㅂ", "개새끼", "개새키", "개세끼", "새끼", "병신", "븅신",
			"지랄", "ㅈㄹ", "좆같", "좆까", "좆나", "좇같", "존나", "졸라", "썅", "쌍놈", "쌍년",
			"미친놈", "미친년", "또라이", "걸레년", "창녀", "창년", "갈보", "호로자식", "후레자식",
			"느금마", "니미", "니애미", "애미없", "애비없", "닥쳐", "꺼져", "병딱", "등신", "찐따",
			"개소리", "개자식", "개놈", "씹새끼", "씹할", "씨부랄", "씨부럴", "좆밥", "좆밥아",
			"뒤져라", "뒈져", "뒈진다", "염병", "엠창", "니기미", "니기리", "죽어버려",
			"개간나", "개후레자식", "후레년", "쌍놈의새끼", "호로새끼", "느개비", "니애비",
			"좆만한", "좆되다", "좆망", "미친새끼", "돌아이", "등신새끼", "찌질이", "찌질하다",
			"빙신", "육시랄", "육실할", "조까", "조까라", "엿먹어", "엿까", "뻐큐", "뻑큐",
			"염병할", "지랄맞다", "씨부리지마", "씨부려", "아가리닥쳐", "아가리찢어", "미친",
			"뒤질래", "뒤지려고", "칼로찌른다", "죽여버린다", "패죽인다", "때려죽인다", "콱죽어",
			"틀딱", "맘충", "애자", "급식충", "짱깨", "쪽바리", "버러지", "노예", "할카스",
			"다카이치", "사나에",
			
			// 한국어 - 성적 표현(섹드립)
			"섹스", "떡치", "떡쳐", "조건만남", "보지", "자지", "딸딸이", "자위", "성기", "성교",
			"야동", "포르노", "폰섹", "박고싶", "꼴린다", "후장", "애널", "썩창", "씹창", "빨아",
			"유두", "발정", "정액", "몸캠", "섹파", "질싸", "안마방", "키스방", "떡칠", "몸팔이",
			"보지년", "걸레짓", "걸레같은", "몸팔아", "몸파는년", "수음", "음란물", "야설", "찌찌",
			"칭칭", "친친", "칭코", "친코", "음순", "빨고싶", "허벌", "만코", "망코", "망게",
			"옷빠이", "옵빠이", "칭게", "친게", "야리칭", "야리친", "야리망", "야리만", "빗치",
			"펠라", "오나니", "딜도", "우머나이저", "페니스", "세후레", "클리토리스", "크리토리스",
			"시오후키", "보추",
			
			// 영어
			"fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cock", "slut", "whore",
			"motherfucker", "cunt", "retard", "sex",
			"damn", "jackass", "douche", "douchebag", "twat", "wanker", "bollocks", "prick", "nigger",
			"nigga", "faggot", "fag", "chink", "spic", "dumbass", "shithead", "dumbfuck",
			"blowjob", "handjob", "cum", "boobs", "tits", "nipple", "horny", "kinky", "hentai",
			"porn", "whorehouse", "pimp",
			"skank", "hoe", "thot", "stfu", "goddamn", "bullshit", "asswipe", "scumbag",
			
			// 일본어
			"しね", "死ね", "くそ", "ちんこ", "まんこ", "ばか", "あほ", "きちがい", "ちんぽ", "おっぱい",
			"やりまん", "ぶす", "でぶ", "きもい", "うざい", "しんでしまえ", "せっくす",
			"気違い", "ばかやろう", "このやろう", "ぶっ殺す", "殺す", "ぱいずり", "マン毛", "チン毛",
			"フェラ", "イラマ", "オナニー", "デリヘル", "ホテヘル", "メンステ", "ソープランド", "ディルド",
			"ペニス", "セフレ", "M字開脚", "ふたなり", "パイパン", "巨乳", "貧乳", "クリトリス", "手コキ",
			"足コキ", "チクニー", "くんに", "マン汁", "アナル", "潮吹き", "高市早苗", "たかいちさなえ",
			"まんげ", "ちんげ", "しおふき"
	);

	// BANNED_WORDS를 히라가나든 가타카나든 등록한 그대로 한 번씩 정규화해 캐시해둔다(메시지마다
	// 매번 다시 변환하지 않도록) - normalizeChar()가 가타카나를 히라가나로 합쳐버리므로 등록
	// 표기와 무관하게 양쪽 다 걸린다.
	private static final List<String> NORMALIZED_BANNED_WORDS = BANNED_WORDS.stream()
			.filter(w -> !w.isEmpty())
			.map(MoktakChatFilter::normalizeForMatch)
			.toList();

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
	
	/**
	 * 금지어 검사 전에 한국어/영어/일본어 문자만 남기고(숫자·기호·공백 등은 무시) 비교한다 -
	 * "시@발", "시1발", "ㅅ.ㅂ" 같이 특수문자/숫자를 끼워 넣는 우회를 막기 위함. 다만 마스킹(*)은
	 * 정규화된 텍스트가 아니라 원문 그대로의 자리에 입혀야 하므로, 정규화 과정에서 남긴 각 글자가
	 * 원문의 몇 번째 글자였는지(indexMap)를 같이 기록해뒀다가 매칭된 구간을 원문 인덱스로 되돌려서
	 * 그 사이에 낀 특수문자까지 전부 포함해 가린다.
	 */
	private String maskBannedWords(String text) {
		char[] original = text.toCharArray();
		StringBuilder normalized = new StringBuilder(original.length);
		List<Integer> indexMap = new ArrayList<>(original.length);
		for (int i = 0; i < original.length; i++) {
			char c = original[i];
			if (isMatchableChar(c)) {
				normalized.append(normalizeChar(c));
				indexMap.add(i);
			}
		}
		String normalizedText = normalized.toString();

		boolean[] maskAt = new boolean[original.length];
		for (String needle : NORMALIZED_BANNED_WORDS) {
			int from = 0;
			int idx;
			while ((idx = normalizedText.indexOf(needle, from)) != -1) {
				int startOrig = indexMap.get(idx);
				int endOrig = indexMap.get(idx + needle.length() - 1);
				for (int k = startOrig; k <= endOrig; k++) {
					maskAt[k] = true;
				}
				from = idx + 1; // 겹치는 매칭도 잡히게 한 칸씩만 이동
			}
		}

		StringBuilder result = new StringBuilder(original.length);
		for (int i = 0; i < original.length; i++) {
			result.append(maskAt[i] ? '*' : original[i]);
		}
		return result.toString();
	}

	/** 금지어 매칭 대상 문자 - 한글(음절+자모), 영어 알파벳, 일본어(히라가나/가타카나/한자). 숫자·기호는
	    제외해서 우회용으로 끼워 넣은 문자는 정규화 단계에서 그냥 사라지게 한다. */
	private static boolean isMatchableChar(char c) {
		return (c >= 0xAC00 && c <= 0xD7A3)   // 가-힣
				|| (c >= 0x3131 && c <= 0x318E)  // ㄱ-ㅎ, ㅏ-ㅣ (한글 자모)
				|| (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
				|| (c >= 0x3040 && c <= 0x30FF)  // 히라가나/가타카나
				|| (c >= 0x4E00 && c <= 0x9FFF); // 한자
	}

	/** 영어는 소문자로, 가타카나(0x30A1~0x30F6)는 히라가나로 변환해서 하나로 합친다 - 유니코드상
	    가타카나 블록이 히라가나보다 정확히 0x60만큼 밀려있어서 빼기 한 번으로 변환된다. 이렇게
	    해두면 금지어를 히라가나/가타카나 어느 쪽으로 등록해도, 사용자가 반대쪽으로 써도 걸린다. */
	private static char normalizeChar(char c) {
		if (c >= 0x30A1 && c <= 0x30F6) {
			return (char) (c - 0x60);
		}
		return Character.toLowerCase(c);
	}

	/** BANNED_WORDS 항목을 한 번씩 정규화해서 NORMALIZED_BANNED_WORDS로 캐시할 때 쓰는 변환 -
	    매칭 대상이 아닌 문자(숫자/기호 등)는 등록 단계에서부터 제거한다. */
	private static String normalizeForMatch(String s) {
		StringBuilder sb = new StringBuilder(s.length());
		for (int i = 0; i < s.length(); i++) {
			char c = s.charAt(i);
			if (isMatchableChar(c)) {
				sb.append(normalizeChar(c));
			}
		}
		return sb.toString();
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
