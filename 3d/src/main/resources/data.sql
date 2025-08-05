INSERT INTO phase (name, unlock_threshold, scene_glb_path) VALUES
('Forêt Enchantée', 0, 'scenes/forest.glb'),
('Caverne des Glaces', 5, 'scenes/ice_cave.glb'),
('Volcan Interdit', 10, 'scenes/volcano.glb');

INSERT INTO quiz_point (position_x, position_y, position_z, phase_id) VALUES
(10.5, 0.0, 15.3, 1),
(-5.2, 1.0, 20.1, 1);

INSERT INTO quiz (question, options, correct_index, quiz_point_id) VALUES
('Quel est l''arbre le plus grand?', '{"Chêne","Séquoia","Baobab","Eucalyptus"}', 1, 1),
('Combien de pattes a une araignée?', '{"6","8","10","12"}', 1, 2);

INSERT INTO reward (name, type, unlock_condition) VALUES
('Explorateur Novice', 'BADGE', 'PASS_QUIZZES:3'),
('Maitre des Glaces', 'SKIN', 'PASS_QUIZZES:5'),
('Seigneur du Feu', 'SKIN', 'PASS_QUIZZES:10');