/*Gère la table quiz_point

Trouve les points de quiz par phase

Exemple: quizPointRepository.findByPhaseId(2)*/
package com.game._d.repository;

import com.game._d.entity.QuizPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizPointRepository extends JpaRepository<QuizPoint, Long> {
    List<QuizPoint> findByPhaseId(Long phaseId);
}
