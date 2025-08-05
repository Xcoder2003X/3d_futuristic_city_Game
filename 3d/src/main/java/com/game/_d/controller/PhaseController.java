package com.game._d.controller;

import com.game._d.entity.Phase;
import com.game._d.service.PhaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/phases")
@RequiredArgsConstructor
public class PhaseController {
    private final PhaseService phaseService;

    @GetMapping("/next")
    public ResponseEntity<Phase> getNextPhase(@RequestParam Long playerId) {
        Phase next = phaseService.unlockNextPhase(playerId);
        if (next != null) {
            return ResponseEntity.ok(next);
        } else {
            return ResponseEntity.noContent().build();
        }
    }

}
