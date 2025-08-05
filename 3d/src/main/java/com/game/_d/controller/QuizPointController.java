package com.game._d.controller;

import com.game._d.entity.QuizPoint;
import com.game._d.service.QuizPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzespoints")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://127.0.0.1:5173")

public class QuizPointController {
    private final QuizPointService quizPointService;

    // return all quizes points of a phase

    @GetMapping("/{phaseId}")
    public ResponseEntity<List<QuizPoint>> getQuizzesForPoint(@PathVariable Long phaseId) {
        return ResponseEntity.ok(quizPointService.getQuizesPointsForPhase(phaseId));
    }




}
