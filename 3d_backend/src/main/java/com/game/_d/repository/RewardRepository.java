/*Gère la table reward

Trouve les récompenses par condition de déblocage

Exemple: rewardRepository.findByUnlockCondition("PASS_QUIZZES:5")*/
package com.game._d.repository;

import com.game._d.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RewardRepository extends JpaRepository<Reward, Long> {
    List<Reward> findByUnlockCondition(String condition);
}
