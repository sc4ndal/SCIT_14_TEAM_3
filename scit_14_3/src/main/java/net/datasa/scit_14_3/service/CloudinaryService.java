package net.datasa.scit_14_3.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 이미지 업로드는 전부 여기로 통일함(사찰/프로그램/리뷰/사찰음식 등).
 * 파일 받아서 Cloudinary에 올리고 URL만 돌려줌 - 그 URL을 각 테이블의
 * image_url(리뷰는 image_urls, 여러 장) 컬럼에 그대로 저장하면 됨.
 */
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(@Value("${cloudinary.cloud-name}") String cloudName,
                              @Value("${cloudinary.api-key}") String apiKey,
                              @Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    public String upload(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new IllegalStateException("이미지 업로드 실패: " + e.getMessage(), e);
        }
    }
}
