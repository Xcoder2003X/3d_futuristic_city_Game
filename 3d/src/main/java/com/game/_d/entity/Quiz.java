package com.game._d.entity;

import com.game._d.config.Typeconverter.StringListConverter;
import jakarta.persistence.*;
import lombok.Data;
import jakarta.persistence.Id;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Quiz {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String question;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> options;

    private Integer correctIndex;

    @ManyToOne
    private QuizPoint quizPoint;
}
