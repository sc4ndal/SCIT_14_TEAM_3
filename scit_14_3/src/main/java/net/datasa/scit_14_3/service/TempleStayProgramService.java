package net.datasa.scit_14_3.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datasa.scit_14_3.repository.TempleStayProgramRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TempleStayProgramService {
	private final TempleStayProgramRepository tspr;
}
