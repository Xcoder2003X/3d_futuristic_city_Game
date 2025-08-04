package com.game._d.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private Integer currentPhase = 1;
    private Integer totalScore = 0;
    private String equippedSkinPath = "characters/char1.glb"; // Default skin path

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "player_rewards",
            joinColumns = @JoinColumn(name = "player_id"),
            inverseJoinColumns = @JoinColumn(name = "reward_id")
    )
    private Set<Reward> unlockedRewards = new HashSet<>();
}
