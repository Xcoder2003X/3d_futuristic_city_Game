/*Logique générale du jeu

Exemple: créer un joueur, récupérer les quiz d'un point*/
package com.game._d.service;

import com.game._d.entity.*;
import com.game._d.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;





@Service
@RequiredArgsConstructor
public class GameService {
    private final PlayerRepository playerRepository;
    private final PhaseRepository phaseRepository;
    private final QuizRepository quizRepository;
    private final RewardRepository rewardRepository;
    private final SkinRepository skinRepository;
    private final BadgeRepository badgeRepository;
    private static final Logger logger = LoggerFactory.getLogger(GameService.class);

    public Player createPlayer(String username) {
        Player player = new Player();
        player.setUsername(username);
        return playerRepository.save(player);
    }

// find the correct quiz with correct points and correct phase 
    public List<Quiz> getQuizzesForPoint(Long pointId) {
        return quizRepository.findByQuizPointId(pointId);
    }

    public List<Skin> getAllSkins() {
        return skinRepository.findAll();
    }


    public void equipSkin(Long playerId, Long skinId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        
        Skin skin = skinRepository.findById(skinId)
                .orElseThrow(() -> new RuntimeException("Skin not found"));
        
        // Check if player has unlocked this skin or if it's default
        boolean hasUnlockedSkin = skin.isDefault() || player.getUnlockedRewards().stream()
                .anyMatch(reward -> 
                    "SKIN".equals(reward.getType()) && 
                    reward.getName().equals(skin.getName())
                );
        
        if (!hasUnlockedSkin) {
            throw new RuntimeException("Skin not unlocked for this player");
        }
        
        // Update player's equipped skin
        player.setEquippedSkinPath(skin.getModelPath());
        playerRepository.save(player);
    }

    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }



    public List<Badge> getUnlockedBadges(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        List<Badge> allBadges = badgeRepository.findAll();
        logger.info("Liste of All Badges ----> {}", allBadges);

        Set<String> unlockedConditions = player.getUnlockedRewards().stream()
                .filter(r -> "BADGE".equals(r.getType()))
                .map(Reward::getUnlockCondition)
                .collect(Collectors.toSet());

        logger.info("Unlocked Rewards  ----> {}", player.getUnlockedRewards());
        logger.info("Liste of Unlocked Conditions ----> {}", unlockedConditions);

        return allBadges.stream()
                .filter(badge -> unlockedConditions.contains(badge.getUnlockCondition()))
                .collect(Collectors.toList());
    }


    public List<Skin> getUnlockedSkins(Long playerId) {

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        List<Skin> allSkins = skinRepository.findAll();
        List<Skin> unlockedSkins = new ArrayList<>();

        // Add default skins
        // 4. On ajoute d’abord les skins par défaut (celles
        //    dont la propriété `isDefault` est vraie).
        unlockedSkins.addAll(allSkins.stream()
                .filter(Skin::isDefault)
                .collect(Collectors.toList()));

        // Add unlocked skins
        // 5. On construit ensuite un ensemble de noms de skins
        //    que le joueur a réellement débloquées via des récompenses.
        //    - player.getUnlockedRewards() retourne un Set<Reward>
        //    - on ne garde que les Reward dont le type est "SKIN"
        //    - on extrait leur nom
        Set<String> unlockedNames = player.getUnlockedRewards().stream()
                .filter(r -> "SKIN".equals(r.getType()))
                .map(Reward::getName)
                .collect(Collectors.toSet());

        // 6. Enfin, on parcourt à nouveau toutes les skins
        //    et on ajoute celles dont le nom figure dans l’ensemble
        //    `unlockedNames`.
        unlockedSkins.addAll(allSkins.stream()
                .filter(skin -> unlockedNames.contains(skin.getName()))
                .collect(Collectors.toList()));

        // 7. On renvoie la liste combinée des skins par défaut + débloquées.
        return unlockedSkins;

    }

}
