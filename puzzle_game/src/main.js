import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js'

   
import { Player } from './Player.js';
import { Terrain } from './Terrain.js';
import './style.css';
import { CharacterController } from './CharacterController.jsx';
import { RewardsUI } from './RewardsUI.js';


// Variables globales
let container, stats, camera, scene, renderer, controls, clock;
let rewardsUI;
let player, terrain ,characterController ,quizPoints = [];
let shadowsEnabled = true;
let texturesEnabled = true;
let triggered = false;

    // Initialize RewardsUI
    rewardsUI = new RewardsUI(1); // Assuming player ID is 1
    // Ici on assigne la fonction au callback onSkinChange
    //Quand un skin change, voici ce que tu dois faire
    rewardsUI.onSkinChange = async (modelPath) => {
        // Remove current model
        if (player.model) {
            player.remove(player.model);
        }
        
        // Load and apply new model
        try {
            await player.loadModel(modelPath);
            console.log('Skin changed successfully');
        } catch (error) {
            console.error('Error changing skin:', error);
        }
    };;


// Initialisation de l'application
function init() {
    // Configuration du container et du rendu
    container = document.getElementById('container');
    
    // Création de la scène avec brouillard pour limiter le rendu à distance
    scene = new THREE.Scene();

    /**background et fog : couleur du ciel (un bleu ciel ici) et brouillard linéaire entre 100 et 300 unités pour 
     * masquer progressivement les objets lointains et améliorer les performances. */
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
    
    // Configuration de la caméra
    /**PerspectiveCamera(fov, aspect, near, far) : champ de vision de 75°, ratio selon la fenêtre, 
     * plans de coupe entre 0.1 et 1000 unités. */
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(244, 5, -300); // Position near where player will spawn
    
    // Configuration du rendu avec activation des ombres
    //Antialiasing pour lisser les bords
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Contrôles de la caméra avec effet d'inertie
    controls = new OrbitControls(camera, renderer.domElement);
    //Damping (inertie) pour rendre le mouvement plus fluide.
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    //Le point cible (controls.target) est le pivot autour duquel la caméra orbite.
    controls.target.set(244, 1, -305); // Match player's initial position
    controls.maxPolarAngle = Math.PI / 2; // Prevent camera from going below ground
    controls.minDistance = 2; // Minimum zoom distance
    controls.maxDistance = 10; // Maximum zoom distance
    
    // Configuration de l'éclairage directionnel (soleil)
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(1, 2, 3);
    sun.castShadow = true;

    /**ésolution et plans de découpe afin de limiter la zone d’ombre au plus utile. */
    sun.shadow.mapSize.width = 1024; // Résolution réduite pour les performances
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    scene.add(sun);
    
    // Lumière ambiante pour éclairer les zones d'ombre
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);
    
    // Statistiques de performance
    //Affiche FPS/millisecondes dans un coin du conteneur pour mesurer les performances en temps réel.

    stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '60px';
    stats.dom.style.left = '10px';
    container.appendChild(stats.dom);


    
    // Création du terrain avec configuration initiale
    terrain = new Terrain({
        terrainPath: 'models/terrain/ground.glb',
        // treePath: 'models/nature/tree.glb',  // Commenté pour le moment
        // rockPath: 'models/nature/rock.glb',   // Commenté pour le moment
        // treeCount: 20,                        // Commenté pour le moment
        // rockCount: 10,                        // Commenté pour le moment
        terrainSize: 30,
        terrainHeight: 20 // Hauteur spécifiée
    });
    scene.add(terrain);
    
    player = new Player('characters/char1.glb');
    
    // Wait for player to load before setting up controller
    player.loadingPromise.then(() => {
        console.log('Player loaded:', player.model);
        
        // Add player to scene first
        scene.add(player);
        
        // Set initial position at ground level
        player.position.set(244, 4, -305);

        
        // Create controller after adding to scene
        characterController = new CharacterController(player, camera, scene);
        
        // Force an immediate position update
        characterController.update(0.016); // Simulate one frame at 60fps
        // Set animations after model is loaded
        if (player.animations) {
            characterController.setAnimations(player.animations);
        }
        
        // Update camera and controls
        camera.position.set(244, 7, -295); // Position camera behind player
        controls.target.set(244, 3, -305); // Look at player
        
        // Optional: Adjust settings
        characterController.setMoveSpeed(6);
        characterController.setCameraDistance(5); // Increased for better view
        characterController.setCameraHeight(2.5); // Raised slightly

        
        // Debug positions
        console.log("Character position:", player.position.toArray());
        console.log("Camera position:", camera.position.toArray());
        console.log("Controls target:", controls.target.toArray());
    });


    
    

    // Horloge pour les animations
    //Permet de calculer delta (temps écoulé entre deux frames) pour animer de façon fluide, indépendante du framerate.
    clock = new THREE.Clock();
    
    // Configuration des événements d'optimisation
    setupEventListeners();
}

// Configuration des contrôles d'optimisation
/**relie les contrôles HTML de l’interface utilisateur à la scène Three.js et au terrain généré : */
    function setupEventListeners() {
        const qualitySlider = document.getElementById('quality');
        const renderDistance = document.getElementById('renderDistance');
        const treeDensity = document.getElementById('treeDensity');
        const rockDensity = document.getElementById('rockDensity');
        const toggleShadows = document.getElementById('toggleShadows');
        const toggleTextures = document.getElementById('toggleTextures');
        const resetBtn = document.getElementById('resetBtn');
        
        // Add rewards button
        const rewardsBtn = document.createElement('button');
        rewardsBtn.textContent = 'Rewards';
        rewardsBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            z-index: 1000;
        `;
        rewardsBtn.onclick = () => rewardsUI.show();
        document.body.appendChild(rewardsBtn);    // Gestion du niveau de qualité (LOD)
    qualitySlider.addEventListener('input', () => {
        const quality = parseInt(qualitySlider.value);
        switch(quality) {
            case 1: // Basse qualité
                terrain.config.treeCount = 10;
                terrain.config.rockCount = 5;
                scene.fog.far = 50;
                break;
            case 2: // Moyenne qualité
                terrain.config.treeCount = 20;
                terrain.config.rockCount = 10;
                scene.fog.far = 100;
                break;
            case 3: // Haute qualité
                terrain.config.treeCount = 50;
                terrain.config.rockCount = 20;
                scene.fog.far = 200;
                break;
        }
        
        // Mise à jour des instances
        //terrain.updateTreeCount(terrain.config.treeCount);
        //terrain.updateRockCount(terrain.config.rockCount);
        
        // Synchronisation des contrôles
        treeDensity.value = terrain.config.treeCount;
        rockDensity.value = terrain.config.rockCount;
        renderDistance.value = scene.fog.far;
    });
    
    // Ajustement de la distance de rendu
    renderDistance.addEventListener('input', () => {
      //Modifie la portée du brouillard (fog.far) en temps réel.
        scene.fog.far = parseInt(renderDistance.value);
        /**Ajuste également la plan de coupe lointain de la caméra (camera.far) pour conserver la cohérence visuelle. */
        camera.far = scene.fog.far + 50;
        //recalcul du frustum de la caméra pour prendre en compte la nouvelle valeur.
        camera.updateProjectionMatrix();
    });
    
    // Ajustement de la densité des arbres
    treeDensity.addEventListener('input', () => {
        terrain.config.treeCount = parseInt(treeDensity.value);
        terrain.updateTreeCount(terrain.config.treeCount);
    });
    
    // Ajustement de la densité des rochers
    rockDensity.addEventListener('input', () => {
        terrain.config.rockCount = parseInt(rockDensity.value);
        terrain.updateRockCount(terrain.config.rockCount);
    });
    
    // Activation/désactivation des ombres
    toggleShadows.addEventListener('click', () => {
        shadowsEnabled = !shadowsEnabled;
        renderer.shadowMap.enabled = shadowsEnabled;
        /**Active ou désactive la génération des ombres au niveau du renderer et de chaque objet (light et mesh) */
        scene.traverse(obj => {
            if (obj.isLight) obj.castShadow = shadowsEnabled;
            if (obj.isMesh) {
                obj.castShadow = shadowsEnabled;
                obj.receiveShadow = shadowsEnabled;
            }
        });
        toggleShadows.textContent = shadowsEnabled ? 
            'Désactiver les ombres' : 'Activer les ombres';
    });
    
    // Activation/désactivation des textures
    //toggle : inverse l’état global shadowsEnabled.
    toggleTextures.addEventListener('click', () => {
        texturesEnabled = !texturesEnabled;
        scene.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                if (texturesEnabled) {
                    if (obj.material.originalMap) {
                        obj.material.map = obj.material.originalMap;
                    }
                } else {
                    obj.material.originalMap = obj.material.map;
                    obj.material.map = null;
                }
                obj.material.needsUpdate = true;
            }
        });
        toggleTextures.textContent = texturesEnabled ? 
            'Désactiver les textures' : 'Activer les textures';
    });
    
    // Réinitialisation des paramètres
    resetBtn.addEventListener('click', () => {
        qualitySlider.value = 2;
        renderDistance.value = 100;
        treeDensity.value = 20;
        rockDensity.value = 10;
        shadowsEnabled = true;
        texturesEnabled = true;
        
        renderer.shadowMap.enabled = true;
        scene.traverse(obj => {
            if (obj.isLight) obj.castShadow = true;
            if (obj.isMesh && obj.material && obj.material.originalMap) {
                obj.material.map = obj.material.originalMap;
                obj.material.needsUpdate = true;
            }
        });
        
        terrain.config.treeCount = 20;
        terrain.config.rockCount = 10;
        terrain.updateTreeCount(20);
        terrain.updateRockCount(10);
        
        scene.fog.far = 100;
        camera.far = 150;
        camera.updateProjectionMatrix();
        
        toggleShadows.textContent = 'Désactiver les ombres';
        toggleTextures.textContent = 'Désactiver les textures';
    });
}

// Boucle d'animation principale
function animate() {

  //requestAnimationFrame : boucle tied to browser repaint, optimisée.
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    controls.update(delta);
    
    // Animation simple du joueur
    //Mouvements du joueur : sinusoidal pour un effet de flottement + rotation continue.
    /*if (player && player.isLoaded) {
        player.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
        player.rotation.y += delta * 0.5;
    }*/
    
    //Mise à jour du rendu, des contrôles et du widget FPS.
    // Update character controller and animations
    if (characterController) {
        // Update character controller (handles movement and ground detection)
        characterController.update(delta);
        
        // Keep character facing forward
        if (player.model) {
            player.model.rotation.y = Math.PI;
        }
        
        // Update camera to follow player
        controls.target.copy(player.position);
        controls.target.y = player.position.y +3  ;
    
    }    

    // Update player animations if needed
    if (player && player.isLoaded && !characterController) {
        player.update(delta);
    }
    
    // Debug output occasionally
    if (Math.floor(performance.now() / 1000) === 0) {
        player.debug();
    }
    

     // Détection de proximité avec les points de quiz
    if (player && quizPoints.length > 0) {
        checkQuizPointProximity();
    }


    
    renderer.render(scene, camera);
    stats.update();
    
    // Mise à jour du compteur FPS
    document.getElementById('fpsCounter').textContent = Math.round(stats.fps || 0);
}

// Gestion du redimensionnement de la fenêtre
function onWindowResize() {
  //Adjuste la caméra et la taille du rendu quand la fenêtre change de dimensions.
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// consume the quizesPoints API and add lumineuse points in the scene

async function fetchQuizPoints(phaseId) {
    // Utilisez l'URL COMPLÈTE avec le port 8080
    const response = await fetch(`http://localhost:8080/api/quizzespoints/${phaseId}`);
    const points = await response.json();
    // Stocker les points dans le tableau global
        quizPoints = points;
    try {
        return points;
    } catch (err) {
        console.error("JSON parse error:", err);
        throw new Error("Invalid JSON response");
    }
}

fetchQuizPoints(1)
  .then(quizPointsArray => {
    console.log("Received quiz points:", quizPointsArray);
    
    quizPointsArray.forEach(quizPoint => {
      // Corrigez les noms de propriétés ici !
      createLight(new THREE.Vector3(
        quizPoint.positionX, 
        quizPoint.positionY, 
        quizPoint.positionZ
      ));
    });
  })
  .catch(err => {
    console.error("Failed to load quiz points:", err);
  });

 function createLight(position) {
    // Main point light
    const light = new THREE.PointLight(0x0000aa, 1, 20);
    light.position.set(position.x, position.y, position.z);
    scene.add(light);

    // Create volumetric light effect with multiple layers
    const lightGroup = new THREE.Group();
    

    // Outer glow layers
    for (let i = 1; i <= 3; i++) {
        const glowGeometry = new THREE.SphereGeometry(0.5 + i * 0.8, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000aa,
            transparent: true,
            opacity: 0.3 / i,
            side: THREE.BackSide,
            fog: false
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        lightGroup.add(glow);
    }

    // Create light rays/beams
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        
        // Create ray geometry
        const rayGeometry = new THREE.PlaneGeometry(4, 40);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0x2222ff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            fog: false
        });
        
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        
        // Position and rotate rays
        ray.position.x = Math.cos(angle) * 1.5;
        ray.position.z = Math.sin(angle) * 1.5;
        ray.lookAt(
            ray.position.x + Math.cos(angle),
            ray.position.y,
            ray.position.z + Math.sin(angle)
        );
        
        lightGroup.add(ray);
    }

    // Create vertical light column
    const columnGeometry = new THREE.CylinderGeometry(0.1, 1.5, 12, 8);
    const columnMaterial = new THREE.MeshBasicMaterial({
        color: 0x1111aa,
        transparent: true,
        opacity: 0.2,
        fog: false
    });
    const lightColumn = new THREE.Mesh(columnGeometry, columnMaterial);
    lightGroup.add(lightColumn);

    // Add subtle animation
    let time = 0;
    function animateLight() {
        time += 0.02;
        
        // Rotate rays
        lightGroup.children.forEach((child, index) => {
            if (index >= 4 && index < 4 + rayCount) { // Only rays
                child.rotateY(0.01);
            }
        });
        
        // Pulse the glow
        const pulseIntensity = 0.8 + Math.sin(time) * 0.2;
        light.intensity = pulseIntensity;
        
        // Animate core glow opacity
        if (lightGroup.children[0]) {
            lightGroup.children[0].material.opacity = 0.7 + Math.sin(time * 2) * 0.2;
        }
        
        requestAnimationFrame(animateLight);
    }
    animateLight();

    // Position the entire light group
    lightGroup.position.copy(light.position);
    scene.add(lightGroup);

    console.log("Created game-style light with rays at:", position);
    
    return { light, lightGroup };
}


  
// fonction pour detecter collision
function checkQuizPointProximity() {
    const playerPos = player.position;
    console.log("playerPos", playerPos);
    const triggerDistance = 2; // Distance de déclenchement
    console.log("quizPoints", quizPoints);
    for (const point of quizPoints) {
        const pointPos = new THREE.Vector3(
            point.positionX,
            point.positionY +17,
            point.positionZ
        );
        
        if (playerPos.distanceTo(pointPos) < triggerDistance && !triggered) {
            triggered = true;
            showQuizPopup(point.id);
            break;
        }
    }
}


// affiche the quiz popup
// Après checkQuizPointProximity
async function showQuizPopup(quizPointId) {
    try {
        const response = await fetch(`http://localhost:8080/api/quizzes/points/${quizPointId}`);
        const quizData = await response.json();
        
        // Debug: Afficher les données reçues
        console.log("Quiz API Response:", quizData);
        
        // Gestion des différents formats de réponse
        let quiz;
        if (Array.isArray(quizData)) {
            // Si la réponse est un tableau, prendre le premier élément
            quiz = quizData[0];
        } else {
            // Si c'est un objet unique
            quiz = quizData;
        }
        
        // Vérification finale
        if (!quiz || !quiz.options) {
            throw new Error("Quiz data is invalid: " + JSON.stringify(quiz));
        }
        
        // Création du popup
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = 'rgba(0, 0, 50, 0.9)';
        popup.style.padding = '20px';
        popup.style.borderRadius = '10px';
        popup.style.zIndex = '1000';
        popup.style.color = 'white';
        popup.style.width = '400px';
        popup.style.fontFamily = 'Arial, sans-serif';
        
        popup.innerHTML = `
            <h2 style="margin-top: 0;">${quiz.question}</h2>
            <div id="quiz-options" style="margin: 20px 0;"></div>
            <button id="close-quiz" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Fermer</button>
        `;
        
        document.body.appendChild(popup);
        
        // Ajouter les options
        const optionsContainer = document.getElementById('quiz-options');
        
        // Debug: Vérifier les options
        console.log("Quiz Options:", quiz.options);
        
        // Utiliser for...of au lieu de forEach pour plus de sécurité
        for (const [index, option] of quiz.options.entries()) {
            const btn = document.createElement('button');
            btn.style.display = 'block';
            btn.style.width = '100%';
            btn.style.margin = '10px 0';
            btn.style.padding = '10px';
            btn.style.background = '#4CAF50';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.textContent = option;
            
            btn.addEventListener('click', () => {
                submitAnswer(quiz.id, index +1);
                document.body.removeChild(popup);
                triggered = false; // Réactiver la détection

            });
            
            optionsContainer.appendChild(btn);
        }
        
        // Gestion de la fermeture
        document.getElementById('close-quiz').addEventListener('click', () => {
            document.body.removeChild(popup);
            triggered = false; // Réactiver la détection
        });
        
    } catch (error) {
        console.error("Error loading quiz:", error);
        // Réactiver la détection même en cas d'erreur
        triggered = false;
    }
}


// Après showQuizPopup
async function submitAnswer(quizId, chosenIndex) {
    try {
        const response = await fetch('http://localhost:8080/api/quizzes/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                playerId: 1, // À remplacer par l'ID réel du joueur
                quizId, 
                chosenIndex 
            })
        });
        
        const result = await response.json();
        
        if (result.correct == true) {
            alert("Bonne réponse !");
            
            // Check for newly unlocked badges
            const badgesResponse = await fetch(`http://localhost:8080/api/badges/player/1`);
            const currentBadges = await badgesResponse.json();
            
            // Compare with previously known badges and show popup for new ones
            const newBadges = currentBadges.filter(badge => 
                !rewardsUI.badges.some(existing => existing.id === badge.id)
            );
            
            if (newBadges.length > 0) {
                newBadges.forEach(badge => {
                    rewardsUI.showBadgePopup(badge);
                });
                // Update the cached badges in rewardsUI
                rewardsUI.badges = currentBadges;
            }
        } else {
            // Récupérer la bonne réponse pour l'affichage
            const correctAnswer = await getCorrectAnswer(quizId);
            alert(`Mauvaise réponse. La bonne réponse était: ${correctAnswer}`);
        }
    } catch (error) {
        console.error("Error submitting answer:", error);
    }
}

async function getCorrectAnswer(quizId) {
    const response = await fetch(`http://localhost:8080/api/quizzes/${quizId}`);
    return response;
}


// Initialisation et démarrage
init();
animate();
window.addEventListener('resize', onWindowResize);



/**
 * Notion 1 a Apprendre
 * scene.fog.far ---> e brouillard est un effet visuel qui fait « fondre » les objets dans une couleur 
 * (par exemple gris ou bleu) à mesure qu’ils s’éloignent de la caméra.
 * Portée (far) ---> C’est la distance à partir de laquelle le brouillard atteint sa densité maximale.
 * Entre near (début du brouillard) et far, l’intensité du brouillard augmente progressivement.

  * Notion 2 a Apprendre
Plan de coupe lointain de la caméra (camera.far ---> C’est la distance maximale à laquelle la caméra prend 
encore en compte les objets.
Tout objet situé au‑delà de camera.far n’est pas rendu du tout (il est « coupé »).

  * Notion 3 a Apprendre
3. Frustum de la caméra ---> Le frustum (ou volume de vue) est la forme géométrique en trapèze 3D qui 
représente la région de l’espace visible par la caméra


 */