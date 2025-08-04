package com.game._d.controller;

import com.game._d.entity.Skin;
import com.game._d.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skins")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://127.0.0.1:5173")

public class SkinController {
    private final GameService gameService;

    @GetMapping
    public ResponseEntity<List<Skin>> getAllSkins() {
        return ResponseEntity.ok(gameService.getAllSkins());
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<Skin>> getUnlockedSkins(@PathVariable Long playerId) {
        return ResponseEntity.ok(gameService.getUnlockedSkins(playerId));
    }

    @PostMapping("/equip")
    public ResponseEntity<?> equipSkin(@RequestParam Long playerId, @RequestParam Long skinId) {
        gameService.equipSkin(playerId, skinId);
        return ResponseEntity.ok().build();
    }
}
