/*Gère la table quiz

Trouve les quiz associés à un point*/
package com.game._d.repository;
import com.game._d.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByQuizPointId(Long quizPointId);

}
