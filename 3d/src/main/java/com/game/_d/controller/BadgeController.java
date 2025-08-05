package com.game._d.controller;

import com.game._d.entity.Badge;
import com.game._d.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://127.0.0.1:5173")

public class BadgeController {
    private final GameService gameService;

    @GetMapping
    public ResponseEntity<List<Badge>> getAllBadges() {
        return ResponseEntity.ok(gameService.getAllBadges());
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<Badge>> getUnlockedBadges(@PathVariable Long playerId) {
        return ResponseEntity.ok(gameService.getUnlockedBadges(playerId));
    }
}
