/*Gère la table player
Opérations: sauvegarde joueur, recherche par ID/username*/
package com.game._d.repository;

import com.game._d.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerRepository extends JpaRepository<Player, Long> {
}

