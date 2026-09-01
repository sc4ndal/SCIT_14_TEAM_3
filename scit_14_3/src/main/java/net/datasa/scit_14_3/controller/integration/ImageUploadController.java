package net.datasa.scit_14_3.controller.integration;

import lombok.RequiredArgsConstructor;
import net.datasa.scit_14_3.service.integration.CloudinaryService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 사찰/프로그램/리뷰/사찰음식 등 이미지 들어가는 등록 폼은 전부 여기로 파일을 올리고,
 * 응답으로 받은 url을 각자 폼의 image_url(또는 image_urls) 필드에 넣어서 같이 저장하면 됨.
 * 로그인 안 한 사람은 못 올림(WebSecurityConfig의 PUBLIC_URLS에 안 넣어둠).
 */
@RestController
@RequiredArgsConstructor
public class ImageUploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/api/images/upload")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
        return Map.of("url", cloudinaryService.upload(file));
    }
}
