package com.game._d.controller;
import com.game._d.entity.Quiz;
import com.game._d.repository.QuizRepository;
import com.game._d.service.GameService;
import com.game._d.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://127.0.0.1:5173")
public class QuizController {
    private final QuizService quizService;
    private final GameService gameService;
    private final QuizRepository quizRepository;
   // find the correct quiz with correct points and correct phase 

    @GetMapping("/points/{pointId}")
    public ResponseEntity<List<Quiz>> getQuizzesForPoint(@PathVariable Long pointId) {
        return ResponseEntity.ok(gameService.getQuizzesForPoint(pointId));
    }


    @PostMapping("/submit")
    public ResponseEntity<AnswerResponse> submitAnswer(
            @RequestBody AnswerRequest request) {
        boolean isCorrect = quizService.submitAnswer(
                request.playerId(),
                request.quizId(),
                request.chosenIndex()
        );

        return ResponseEntity.ok(new AnswerResponse(isCorrect));
    }

    // Classes DTO
    public record AnswerRequest(Long playerId, Long quizId, Integer chosenIndex) {}
    public record AnswerResponse(boolean correct) {}


    @Transactional(readOnly = true) // Ajoutez cette annotation
    @GetMapping("/{quizId}")
    public ResponseEntity<Integer> getCorrectAnswer(@PathVariable Long quizId) {
        Quiz quiz = quizRepository.findById(quizId) // Utilisez findById au lieu de getOne
                .orElseThrow(() -> new RuntimeException("Quiz not found with id: " + quizId));

        return ResponseEntity.ok(quiz.getCorrectIndex());
    }
}