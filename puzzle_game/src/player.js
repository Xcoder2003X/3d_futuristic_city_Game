import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
/**
 * Classe Player optimisée pour la performance
 * Utilise des géométries simplifiées et une gestion efficace des ressources
 */
export class Player extends THREE.Group {
    constructor(modelPath = 'characters/char1.glb') {
        super();
        
        this.modelPath = modelPath;
        this.model = null;
        this.isLoaded = false;
        this.loadingPromise = null;
        this.terrainHeight = 20;
        // Position initiale
        
        // Démarrage du chargement
        this.loadModel(modelPath);
    }
    
    /**
     * Charge le modèle 3D avec optimisation des performances
     * Utilise une géométrie de secours si le chargement échoue
     */
    async loadModel() {
        const loader = new GLTFLoader();
        
        try {
            this.loadingPromise = new Promise((resolve, reject) => {
                loader.load(
                    this.modelPath,
                    (gltf) => {
                         // Store the animations
                         console.log('Animations trouvées:', gltf.animations);
                         console.log('Nombre d\'animations:', gltf.animations.length);
                        this.model = gltf.scene;
                        
                        // Store animations
                        this.animations = gltf.animations;
                        this.model.animations = gltf.animations;
                        
                        // Add model as child of Player
                        this.add(this.model);
                        
                        // Initialize mixer here but don't start animations
                        this.mixer = new THREE.AnimationMixer(this.model);


                         // Debug de la taille du modèle avant ajustement
                const boxBefore = new THREE.Box3().setFromObject(this.model);
                console.log('Taille du modèle avant ajustement:', {
                    width: boxBefore.max.x - boxBefore.min.x,
                    height: boxBefore.max.y - boxBefore.min.y,
                    depth: boxBefore.max.z - boxBefore.min.z
                });



                        // Si il y a des animations, jouer la première par défaut
                        if (this.animations.length > 0) {
                            this.currentAction = this.mixer.clipAction(this.animations[0]);
                            this.currentAction.play();
                        }


                        // Optimisation: Configuration des propriétés de performance
                        this.model.traverse((child) => {
                            if (child.isMesh) {
                                // Activation du frustum culling
                                child.frustumCulled = true;
                                
                                // Optimisation des ombres
                                child.castShadow = true;
                                child.receiveShadow = false;
                                
                                // Simplification des matériaux si nécessaire
                                if (child.material) {
                                    child.material.flatShading = true;
                                }
                            }
                        });
                        
                        // Reset model position and rotation
                        this.model.position.set(0, 0, 0);
                        this.model.rotation.set(0, 0, 0);
                        
                        // Get initial size
                        const box = new THREE.Box3().setFromObject(this.model);
                        const size = box.getSize(new THREE.Vector3());
                        
                        // Calculate scale to make model about 2 units tall
                        const desiredHeight = 2;
                        const scale = desiredHeight / size.y;
                        this.model.scale.set(scale, scale, scale);
                        
                        // Center model at origin
                        const centeredBox = new THREE.Box3().setFromObject(this.model);
                        const center = centeredBox.getCenter(new THREE.Vector3());
                        this.model.position.sub(center);
                        
                        // Adjust to make feet at y=0
                        const finalBox = new THREE.Box3().setFromObject(this.model);
                        this.model.position.y -= finalBox.min.y;
                        
                        console.log('Model final position:', this.model.position);
                        console.log('Model final scale:', this.model.scale);

                

                // Debug de la taille finale
                const boxAfter = new THREE.Box3().setFromObject(this.model);
                console.log('Taille du modèle après ajustement:', {
                    width: boxAfter.max.x - boxAfter.min.x,
                    height: boxAfter.max.y - boxAfter.min.y,
                    depth: boxAfter.max.z - boxAfter.min.z
                });

                // Jouer l'animation
                if (this.animations.length > 0) {
                    const clip = this.animations[0];
                    console.log('Animation clip:', clip);
                    this.currentAction = this.mixer.clipAction(clip);
                    this.currentAction.play();
                }
                        
                        this.add(this.model);
                        this.isLoaded = true;
                        resolve(this.model);
                    },

                    (progress) => {
                console.log('Chargement:', (progress.loaded / progress.total * 100) + '%');
                    },
                    (error) => {
                        console.error('Erreur de chargement du modèle:', error);
                        this.createFallbackGeometry();
                        reject(error);
                    }
                );
            });
            
            return await this.loadingPromise;
        } catch (error) {
            console.error('Erreur dans le chargement du modèle:', error);
            return null;
        }
    }


    // Nouvelle méthode pour mettre à jour les animations
    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }


    // Méthode pour changer d'animation
    playAnimation(index) {
        if (this.currentAction) {
            this.currentAction.stop();
        }
        if (this.animations[index]) {
            this.currentAction = this.mixer.clipAction(this.animations[index]);
            this.currentAction.play();
        }
    }
    
    /**
     * Crée une géométrie de secours simplifiée
     * Utilisée en cas d'échec de chargement du modèle principal
     */
    createFallbackGeometry() {
        // Géométrie capsule simplifiée (moins de polygones)
        const geometry = new THREE.CapsuleGeometry(0.25, 0.6, 4, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x4040c0,
            wireframe: true // Mode filaire pour économiser des ressources
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        
        this.add(mesh);
        this.isLoaded = true;
    }
    
    /**
     * Attend que le modèle soit chargé
     * @returns {Promise} Promesse résolue quand le modèle est prêt
     */
    async waitForLoad() {
        if (this.isLoaded) return this.model;
        if (this.loadingPromise) return await this.loadingPromise;
        return null;
    }

    debug() {
    console.log({
        position: this.position,
        modelExists: !!this.model,
        isLoaded: this.isLoaded,
        hasAnimations: this.animations?.length > 0,
        currentAction: !!this.currentAction
    });
}
}




/**
 * Notion 1 a Apprendre
 * Frustum culling est une optimisation de rendu qui évite de dessiner les objets situés complètement en
 *  dehors du « pyramide de vue » (le frustum du caméra). En three.js, cela fonctionne ainsi :

Le frustum
C’est la pyramide tronquée (une pyramide dont le sommet est au niveau de la lentille) qui définit ce que la 
caméra peut voir :

plan proche (near) et plan lointain (far)

champ horizontal et vertical (fov et aspect)

Le test de culling
À chaque frame, pour chaque objet (Mesh, Line, Points…), three.js :

calcule une sphère englobante (bounding sphere) à partir de la géométrie

teste si cette sphère intersecte ou est à l’intérieur du frustum caméra

si non, l’objet est ignoré (non envoyé au GPU) → économie de temps de rendu et de bande passante

Activation / désactivation
Par défaut, object.frustumCulled = true. Pour forcer l’objet à toujours être dessiné (même hors caméra) :

Ntion 2 à Apprendre

this.model est généralement un objet de type THREE.Object3D (par exemple le résultat d’un chargement GLTF). 
La méthode .traverse() vous permet de parcourir tous ses descendants (enfants, petits‑enfants, etc.) 
de façon récursive. À chaque nœud visité, votre callback reçoit cet objet en argument (child dans votre code)
 */