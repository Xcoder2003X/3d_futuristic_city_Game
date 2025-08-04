/*import * as THREE from 'three';
export class Player extends THREE.Mesh {

    constructor() {
        super();
        this.geometry = new THREE.CapsuleGeometry(0.25, 0.6);
        this.material = new THREE.MeshStandardMaterial({ color: 0x4040c0 });
        this.position.set(5.5, 0.5, 5.5);
    }
}*/

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Player extends THREE.Group {
    constructor(modelPath = 'path/to/your/model.glb') {
        super();
        
        this.modelPath = modelPath;
        this.model = null;
        this.isLoaded = false;
        this.loadingPromise = null;
        
        // Position initiale
        this.position.set(5.5, 0.5, 5.5);
        
        // Chargement du modèle
        this.loadModel();
    }
    
    async loadModel() {
        const loader = new GLTFLoader();
        
        try {
            this.loadingPromise = new Promise((resolve, reject) => {
                loader.load(
                    this.modelPath,
                    (gltf) => {
                        this.model = gltf.scene;
                        
                        // Ajuster l'échelle si nécessaire
                        this.model.scale.set(1, 1, 1);
                        
                        // Centrer le modèle si nécessaire
                        const box = new THREE.Box3().setFromObject(this.model);
                        const center = box.getCenter(new THREE.Vector3());
                        this.model.position.sub(center);
                        
                        // Ajouter le modèle au groupe
                        this.add(this.model);
                        
                        this.isLoaded = true;
                        console.log('Modèle GLB chargé avec succès');
                        resolve(this.model);
                    },
                    (progress) => {
                        console.log('Progression du chargement:', (progress.loaded / progress.total * 100) + '%');
                    },
                    (error) => {
                        console.error('Erreur lors du chargement du modèle GLB:', error);
                        this.createFallbackGeometry();
                        reject(error);
                    }
                );
            });
            
            return await this.loadingPromise;
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            return null;
        }
    }
    
    // Géométrie de secours si le chargement échoue
    createFallbackGeometry() {
        const fallbackGeometry = new THREE.CapsuleGeometry(0.25, 0.6);
        const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0x4040c0 });
        const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
        this.add(fallbackMesh);
        this.isLoaded = true;
        console.log('Utilisation de la géométrie de secours');
    }
    
    // Méthode pour attendre que le modèle soit chargé
    async waitForLoad() {
        if (this.isLoaded) return this.model;
        if (this.loadingPromise) {
            return await this.loadingPromise;
        }
        return null;
    }
    
    // Méthode pour obtenir toutes les animations disponibles
    getAnimations() {
        if (this.model && this.model.animations) {
            return this.model.animations;
        }
        return [];
    }
    
    // Méthode pour configurer un AnimationMixer si le modèle a des animations
    setupAnimations() {
        if (!this.model) return null;
        
        const mixer = new THREE.AnimationMixer(this.model);
        const animations = this.getAnimations();
        
        if (animations.length > 0) {
            console.log(`${animations.length} animation(s) trouvée(s):`, animations.map(anim => anim.name));
            
            // Vous pouvez jouer une animation spécifique ici
            // const action = mixer.clipAction(animations[0]);
            // action.play();
        }
        
        return mixer;
    }
    
    // Méthode pour ajuster l'échelle du modèle
    setScale(x, y, z) {
        if (this.model) {
            this.model.scale.set(x, y, z);
        }
    }
    
    // Méthode pour obtenir la boîte englobante du modèle
    getBoundingBox() {
        if (this.model) {
            return new THREE.Box3().setFromObject(this.model);
        }
        return new THREE.Box3();
    }
}

// Exemple d'utilisation dans votre scène principale:
/*
// Dans votre fichier principal (ex: main.js)
const player = new Player('models/your-character.glb');
scene.add(player);

// Attendre que le modèle soit chargé avant de faire des opérations
player.waitForLoad().then((model) => {
    if (model) {
        console.log('Le joueur est prêt!');
        
        // Configurer les animations si nécessaire
        const mixer = player.setupAnimations();
        
        // Dans votre boucle d'animation, mettre à jour le mixer
        // if (mixer) mixer.update(deltaTime);
    }
});
*/