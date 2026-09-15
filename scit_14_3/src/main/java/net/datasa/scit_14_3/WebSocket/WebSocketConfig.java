package net.datasa.scit_14_3.WebSocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
	
	private final MoktakWebSocketHandler moktakWebSocketHandler;
	
	public WebSocketConfig(MoktakWebSocketHandler moktakWebSocketHandler) {
		this.moktakWebSocketHandler = moktakWebSocketHandler;
	}
	
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(moktakWebSocketHandler, "/ws/moktak")
				.setAllowedOriginPatterns("*");
	}
}