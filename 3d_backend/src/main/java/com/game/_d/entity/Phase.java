package com.game._d.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;


@Entity
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Phase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Integer unlockThreshold; // 3atabat al fath
    private String sceneGlbPath; // URL to 3D scene
}
