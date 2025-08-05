package com.game._d.service;

import com.game._d.entity.QuizPoint;
import com.game._d.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizPointService {
    private final QuizPointRepository quizpointRepository;


    // find the correct quiz with correct points and correct phase
    public List<QuizPoint> getQuizesPointsForPhase(Long phaseId) {
        return quizpointRepository.findByPhaseId(phaseId);
    }
}
