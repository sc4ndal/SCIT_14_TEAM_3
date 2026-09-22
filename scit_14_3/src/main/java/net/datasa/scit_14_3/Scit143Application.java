package net.datasa.scit_14_3;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@SpringBootApplication
@EnableCaching
@EnableScheduling
public class Scit143Application {

	public static void main(String[] args) {
		SpringApplication.run(Scit143Application.class, args);
	}

	// 마이페이지 허브의 카운트 조회 7개처럼, 서로 무관한 원격 DB(Aiven) 조회 여러 개를 순차로
	// 날리면 왕복시간이 그대로 다 더해짐(Aiven 왕복 1초씩만 잡아도 7개면 7초+) - 병렬로
	// 동시에 날려서 제일 느린 쿼리 하나만큼의 시간으로 줄인다(MypageController 참고).
	@Bean
	public ExecutorService mypageCountExecutor() {
		return Executors.newFixedThreadPool(8);
	}

}
