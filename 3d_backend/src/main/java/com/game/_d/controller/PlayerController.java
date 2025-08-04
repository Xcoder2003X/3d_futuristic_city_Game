package com.game._d.controller;

import com.game._d.entity.Player;
import com.game._d.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {
    private final GameService gameService;

    @PostMapping
    public ResponseEntity<Player> createPlayer(@RequestParam String username) {
        return ResponseEntity.ok(gameService.createPlayer(username));
    }
}
