/*
* Gère la soumission des réponses aux quiz

Calcule les scores et débloque les récompenses*/
package com.game._d.service;

import com.game._d.entity.Player;
import com.game._d.entity.Quiz;
import com.game._d.entity.Reward;
import com.game._d.repository.PlayerRepository;
import com.game._d.repository.QuizRepository;
import com.game._d.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {
    private final QuizRepository quizRepository;
    private final PlayerRepository playerRepository;
    private final RewardRepository rewardRepository;

    @Transactional
    public boolean submitAnswer(Long playerId, Long quizId, Integer chosenIndex) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        boolean isCorrect = chosenIndex.equals(quiz.getCorrectIndex());

        if(isCorrect) {
            Player player = playerRepository.findById(playerId)
                    .orElseThrow(() -> new RuntimeException("Player not found"));
            player.setTotalScore(player.getTotalScore() + 1);
            playerRepository.save(player);
            checkForRewards(playerId);
        }

        return isCorrect;
    }

   // find rewards that match the condition "PASS_QUIZZES:score" 
   private void checkForRewards(Long playerId) {
       Player player = playerRepository.findById(playerId)
               .orElseThrow(() -> new RuntimeException("Player not found"));

       String condition = "PASS_QUIZZES:" + player.getTotalScore();
       List<Reward> rewards = rewardRepository.findByUnlockCondition(condition);

       if(!rewards.isEmpty()) {
           for(Reward reward : rewards) {
               // Associez la récompense au joueur
               player.getUnlockedRewards().add(reward);
           }
           playerRepository.save(player);
       }
   }
}
