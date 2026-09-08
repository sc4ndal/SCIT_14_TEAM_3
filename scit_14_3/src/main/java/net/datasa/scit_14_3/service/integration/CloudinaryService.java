package net.datasa.scit_14_3.service.integration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 이미지 업로드/삭제는 전부 여기로 통일함(사찰/프로그램/리뷰/사찰음식 등).
 * 파일 받아서 Cloudinary에 올리고 URL만 돌려줌 - 그 URL을 각 테이블의
 * image_url(리뷰는 image_urls, 여러 장) 컬럼에 그대로 저장하면 됨.
 */
@Slf4j
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final String cloudName;

    public CloudinaryService(@Value("${cloudinary.cloud-name}") String cloudName,
                              @Value("${cloudinary.api-key}") String apiKey,
                              @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudName = cloudName;
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    // 전부 이 폴더 안에 모아서 올림(Cloudinary 대시보드에서 관리하기 편하도록)
    private static final String UPLOAD_FOLDER = "SCIT-14-3";

    /**
     * 폼(리뷰 등)이 imageUrls로 받은 문자열이 실제로 우리 Cloudinary 계정/업로드 폴더의 URL이
     * 맞는지 확인한다. 클라이언트가 아예 다른 곳 URL이나 조작된 값을 끼워넣는 걸 막기 위함 -
     * "누구 소유인지"까지는 못 가리지만 최소한 우리 Cloudinary 자산이라는 것만은 보장한다.
     */
    public boolean isManagedUrl(String url) {
        if (url == null) {
            return false;
        }
        String expectedPrefix = "https://res.cloudinary.com/" + cloudName + "/image/upload/";
        return url.startsWith(expectedPrefix) && url.contains("/" + UPLOAD_FOLDER + "/");
    }

    public String upload(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("folder", UPLOAD_FOLDER));
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new IllegalStateException("이미지 업로드 실패: " + e.getMessage(), e);
        }
    }

    // upload()가 돌려준 secure_url 안에서 public_id만 뽑아냄
    // 예: https://res.cloudinary.com/<cloud>/image/upload/v1234567890/SCIT-14-3/abcde12345.jpg
    //     -> public_id = SCIT-14-3/abcde12345
    // 끝의 (?:\?.*)? 는 혹시 붙어있을 수 있는 쿼리스트링을 무시하기 위함 - 이게 없으면 확장자
    // 뒤에 아무 문자라도 더 있을 때 $ 앵커가 안 맞아서 조용히 매칭 자체가 실패해버린다.
    private static final Pattern PUBLIC_ID_PATTERN =
            Pattern.compile("/upload/(?:v\\d+/)?(.+?)\\.[a-zA-Z0-9]+(?:\\?.*)?$");

    /**
     * 리뷰 삭제/수정 시 더 이상 쓰지 않는 사진을 Cloudinary에서도 지운다(무료 플랜 용량 관리).
     * 삭제 실패는 리뷰 자체의 삭제/수정을 막을 이유가 안 되므로 예외를 던지지 않고 로그만 남긴다.
     * destroy()는 public_id를 못 찾아도 예외 없이 {"result":"not found"}만 돌려주므로,
     * 반환값을 확인하지 않으면 실패해도 아무 흔적 없이 조용히 넘어간다 - 반드시 로그로 남긴다.
     */
    public void delete(String secureUrl) {
        if (secureUrl == null || secureUrl.isBlank()) {
            return;
        }
        Matcher matcher = PUBLIC_ID_PATTERN.matcher(secureUrl);
        if (!matcher.find()) {
            log.warn("Cloudinary public_id를 추출하지 못해 삭제를 건너뜀: {}", secureUrl);
            return;
        }
        String publicId = matcher.group(1);
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            Object status = result != null ? result.get("result") : null;
            if ("ok".equals(status)) {
                log.info("Cloudinary 이미지 삭제 완료 (publicId={})", publicId);
            } else {
                log.warn("Cloudinary 이미지 삭제 실패 (publicId={}, result={})", publicId, status);
            }
        } catch (IOException e) {
            log.warn("Cloudinary 이미지 삭제 중 예외 (publicId={})", publicId, e);
        }
    }
}
