import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
/**
 * Classe Terrain optimisée avec techniques d'instancing
 * pour le rendu performant d'objets répétitifs
 */
export class Terrain extends THREE.Group {
    constructor(config = {}) {
        super();
        
        // Configuration par défaut avec fusion des paramètres
        this.config = {
            terrainPath: 'models/terrain/ground.glb',
            treePath: 'models/nature/tree.glb',
            rockPath: 'models/nature/rock.glb',
            treeCount: 100,
            rockCount: 50,
            terrainSize: 200,
            terrainHeight: 20,
            ...config
        };
        
        this.loader = new GLTFLoader();
        this.loadedModels = new Map(); // Cache des modèles chargés
        this.isLoaded = false;
        
        // InstancedMesh pour les performances
        this.treeInstances = null;
        this.rockInstances = null;
        
        this.initTerrain();
    }
    
    /**
     * Initialise le terrain de manière asynchrone
     */
    async initTerrain() {
        try {
            // Chargement parallèle des éléments
            await Promise.all([
                this.createTerrainPlane(),
                //this.createTrees(),
                //this.createRocks()
            ]);
            this.isLoaded = true;
        } catch (error) {
            console.error('Erreur d\'initialisation du terrain:', error);
            this.createFallbackTerrain();
        }
    }
    
    /**
     * Charge un modèle GLB avec mise en cache
     * @param {string} path Chemin du modèle
     * @returns {Promise} Modèle cloné
     */
    async loadGLBModel(path) {
        // Utilisation du cache pour éviter les chargements multiples
        if (this.loadedModels.has(path)) {
            return this.loadedModels.get(path).clone();
        }
        
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Optimisation: Configuration des propriétés
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.frustumCulled = true; // Activation du culling
                            child.castShadow = false;    // Désactivé pour les instances
                            child.receiveShadow = false;
                        }
                    });
                    
                    this.loadedModels.set(path, model);
                    resolve(model.clone());
                },
                undefined,
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Crée le plan de terrain principal
     */
    async createTerrainPlane() {
        try {
            const terrainModel = await this.loadGLBModel(this.config.terrainPath);
            
            // Ajustement de l'échelle et position
            terrainModel.scale.set(this.config.terrainSize, this.config.terrainHeight, this.config.terrainSize);
            terrainModel.position.set(0, 0, 0);
            
            // Activation des ombres uniquement pour le terrain
            terrainModel.traverse((child) => {
                if (child.isMesh) {
                    child.receiveShadow = true;
                }
            });
            
            this.add(terrainModel);
        } catch (error) {
            this.createFallbackTerrain();
        }
    }
    
    /**
     * Crée les arbres avec instancing pour performance
     */
    async createTrees() {
        const treeGroup = new THREE.Group();
        treeGroup.name = 'trees';
        
        try {
            const treeModel = await this.loadGLBModel(this.config.treePath);
            
            // Extraction de la géométrie et du matériau
            let treeGeometry, treeMaterial;
            treeModel.traverse((child) => {
                if (child.isMesh) {
                    treeGeometry = child.geometry;
                    treeMaterial = child.material;
                }
            });
            
            if (!treeGeometry || !treeMaterial) {
                throw new Error('Modèle d\'arbre invalide');
            }
            
            // Création du mesh instancié
            const instanceCount = this.config.treeCount;
            const instancedMesh = new THREE.InstancedMesh(
                treeGeometry, 
                treeMaterial, 
                instanceCount
            );
            
            // Optimisation pour mises à jour fréquentes
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            // Positionnement des instances
            const dummy = new THREE.Object3D();
            for (let i = 0; i < instanceCount; i++) {
                const x = (Math.random() - 0.5) * this.config.terrainSize;
                const z = (Math.random() - 0.5) * this.config.terrainSize;
                const scale = 5 + Math.random() * 0.4;
                const rotation = Math.random() * Math.PI * 2;
                
                dummy.position.set(x, -(this.config.terrainHeight/4 + 0.5), z);
                dummy.rotation.y = rotation;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }
            
            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.castShadow = true; // Ombres pour tout le groupe
            treeGroup.add(instancedMesh);
            this.treeInstances = instancedMesh;
            
            this.add(treeGroup);
        } catch (error) {
            this.createFallbackTrees(treeGroup);
        }
    }
    
    /**
     * Crée les rochers avec instancing
     */

    /**async : permet d’utiliser await à l’intérieur pour simplifier la promesse de chargement de modèle.

rockGroup : un conteneur (THREE.Group) qui va regrouper toutes les instances de rochers, facilitant leur 
manipulation globale (position, rotation, ajout/suppression dans la scène). */
    async createRocks() {
        const rockGroup = new THREE.Group();
        rockGroup.name = 'rocks';
        
        //await : la méthode attend la fin du chargement avant de poursuivre.

        try {
            const rockModel = await this.loadGLBModel(this.config.rockPath);
            
            // Extraction de la géométrie et du matériau
            //.traverse() : parcourt récursivement tous les nœuds (Group, Mesh, Light…) du modèle.
            //child.isMesh : filtre uniquement les Mesh (sous‑objets qui portent une géométrie et un matériau).


            let rockGeometry, rockMaterial;
            rockModel.traverse((child) => {
                if (child.isMesh) {
                    rockGeometry = child.geometry;
                    rockMaterial = child.material;
                }
            });
            
            if (!rockGeometry || !rockMaterial) {
                throw new Error('Modèle de rocher invalide');
            }
            
            // Création du mesh instancié
            const instanceCount = this.config.rockCount;
            /**crée un seul objet GPU capable d’afficher count instances du même maillage avec des matrices de 
             * transformation distinctes, très performant pour de nombreux objets identiques. */

            const instancedMesh = new THREE.InstancedMesh(
                rockGeometry, 
                rockMaterial, 
                instanceCount
            );
            
            //instanceMatrix : buffer contenant la matrice 4×4 de chaque instance.
            //setUsage(THREE.DynamicDrawUsage) : informe WebGL que ce buffer sera mis à jour fréquemment
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            // Positionnement des instances
            const dummy = new THREE.Object3D();
            for (let i = 0; i < instanceCount; i++) {
                const x = (Math.random() - 0.5) * this.config.terrainSize;
                const z = (Math.random() - 0.5) * this.config.terrainSize;
                const scale = 1 + Math.random();
                const rotation = new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                // Application au "dummy" (objet temporaire)
                dummy.position.set(x, -(this.config.terrainHeight/4 + 0.5), z);
                dummy.setRotationFromEuler(rotation);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                // Copie de la matrice dans l’instance i
                instancedMesh.setMatrixAt(i, dummy.matrix);
            }
            
            //needsUpdate = true : indique à three.js de renvoyer le buffer mis à jour au GPU.
            instancedMesh.instanceMatrix.needsUpdate = true;
            instancedMesh.castShadow = true;
            rockGroup.add(instancedMesh);
            this.rockInstances = instancedMesh;
            
            this.add(rockGroup);
        } catch (error) {
            this.createFallbackRocks(rockGroup);
        }
    }


    
    /**
     * Met à jour le nombre d'arbres dynamiquement
     * @param {number} newCount Nouveau nombre d'arbres
     */
    updateTreeCount(newCount) {
        if (!this.treeInstances) return;
        
        const currentCount = this.treeInstances.count;
        this.treeInstances.count = newCount;
        
        // Ajout de nouvelles instances si nécessaire
        if (newCount > currentCount) {
            const dummy = new THREE.Object3D();
            for (let i = currentCount; i < newCount; i++) {
                const x = (Math.random() - 0.5) * this.config.terrainSize;
                const z = (Math.random() - 0.5) * this.config.terrainSize;
                const scale = 0.8 + Math.random() * 0.4;
                const rotation = Math.random() * Math.PI * 2;
                
                dummy.position.set(x, 0, z);
                dummy.rotation.y = rotation;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                this.treeInstances.setMatrixAt(i, dummy.matrix);
            }
        }
        
        this.treeInstances.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * Met à jour le nombre de rochers dynamiquement
     * @param {number} newCount Nouveau nombre de rochers
     */
    updateRockCount(newCount) {
        if (!this.rockInstances) return;
        
        const currentCount = this.rockInstances.count;
        this.rockInstances.count = newCount;
        
        // Ajout de nouvelles instances si nécessaire
        if (newCount > currentCount) {
            const dummy = new THREE.Object3D();
            for (let i = currentCount; i < newCount; i++) {
                const x = (Math.random() - 0.5) * this.config.terrainSize;
                const z = (Math.random() - 0.5) * this.config.terrainSize;
                const scale = 0.5 + Math.random();
                const rotation = new THREE.Euler(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                
                dummy.position.set(x, 0, z);
                dummy.setRotationFromEuler(rotation);
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                this.rockInstances.setMatrixAt(i, dummy.matrix);
            }
        }
        
        this.rockInstances.instanceMatrix.needsUpdate = true;
    }
    
    /**
     * Crée un terrain de secours simplifié
     */
    createFallbackTerrain() {
        const geometry = new THREE.PlaneGeometry(
            this.config.terrainSize, 
            this.config.terrainSize, 
            10, 10 // Moins de subdivisions pour la performance
        );
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90,
            wireframe: false
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        plane.receiveShadow = true;
        
        this.add(plane);
    }
    
    /**
     * Crée des arbres de secours simplifiés
     * @param {THREE.Group} treeGroup Groupe d'arbres
     */
    createFallbackTrees(treeGroup) {
        // Géométrie simple pour les arbres
        const geometry = new THREE.ConeGeometry(0.5, 2, 8); // Peu de faces
        const material = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < this.config.treeCount; i++) {
            const tree = new THREE.Mesh(geometry, material);
            const x = (Math.random() - 0.5) * this.config.terrainSize;
            const z = (Math.random() - 0.5) * this.config.terrainSize;
            tree.position.set(x, 1, z);
            tree.castShadow = true;
            treeGroup.add(tree);
        }
        
        this.add(treeGroup);
    }
    
    /**
     * Crée des rochers de secours simplifiés
     * @param {THREE.Group} rockGroup Groupe de rochers
     */
    createFallbackRocks(rockGroup) {
        // Géométrie simple pour les rochers
        const geometry = new THREE.DodecahedronGeometry(0.3, 0); // Niveau de détail bas
        const material = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        for (let i = 0; i < this.config.rockCount; i++) {
            const rock = new THREE.Mesh(geometry, material);
            const x = (Math.random() - 0.5) * this.config.terrainSize;
            const z = (Math.random() - 0.5) * this.config.terrainSize;
            rock.position.set(x, 0.3, z);
            rock.castShadow = true;
            rockGroup.add(rock);
        }
        
        this.add(rockGroup);
    }
    
    /**
     * Attend que le terrain soit complètement chargé
     * @returns {Promise} Promesse résolue quand le chargement est complet
     */
    async waitForLoad() {
        while (!this.isLoaded) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this;
    }
}




/**
 * Notion 1 a Apprendre
 * instancedMesh.instanceMatrix
C’est l’attribut de transformation par instance (une matrice 4×4) que Three.js envoie au GPU pour chaque 
exemplaire (instance) de votre mesh instancié. Derrière le capot, c’est un BufferAttribute 
(plus précisément un InstancedBufferAttribute) qui contient toutes ces matrices les unes à la suite des autres.

.setUsage(THREE.DynamicDrawUsage)
C’est un hint (indice) qu’on donne à WebGL pour lui dire comment on va mettre à jour et utiliser ce buffer de 
données :

StaticDrawUsage (défaut) : les données ne changent qu’une fois (ou très rarement).

DynamicDrawUsage : les données changent souvent (à chaque frame, ou fréquemment).

StreamDrawUsage : les données changent très fréquemment puis sont utilisées peu de temps après.
 */