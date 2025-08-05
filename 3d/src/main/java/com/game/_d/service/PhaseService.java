/*Gère la progression dans les phases

Détermine quand débloquer une nouvelle phase

Utilise: PhaseRepository, PlayerRepository*/
package com.game._d.service;

import com.game._d.entity.Phase;
import com.game._d.entity.Player;
import com.game._d.repository.PhaseRepository;
import com.game._d.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

// unlockNextPhase ----->  return the next phase of a player = availables phases + pick the first one with id > current one
@Service
@RequiredArgsConstructor
public class PhaseService {
    private final PhaseRepository phaseRepository;
    private final PlayerRepository playerRepository;

    public Phase unlockNextPhase(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        List<Phase> availablePhases = phaseRepository
                .findByUnlockThresholdLessThanEqual(player.getTotalScore());

        return availablePhases.stream()
                .filter(p -> p.getId() > player.getCurrentPhase())
                .findFirst()
                .orElse(null);
    }
}
