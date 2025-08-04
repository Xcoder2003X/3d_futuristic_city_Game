/*Gère la table phase
Méthode spéciale: findByUnlockThresholdLessThanEqual() pour trouver les phases déblocables*/
package com.game._d.repository;

import com.game._d.entity.Phase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhaseRepository extends JpaRepository<Phase, Long> {
    List<Phase> findByUnlockThresholdLessThanEqual(Integer passedCount);
}
