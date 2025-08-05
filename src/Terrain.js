import * as THREE from 'three';

const gridTexture = new THREE.TextureLoader().load( "textures/grass.png" );

export class Terrain extends THREE.Mesh {

    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
        this.treeCount = 10 ;
        this.rocksCount = 15;
        
        this.genereteWorld();
       
        
            
        }


        genereteWorld(){

        this.clear();

        this.createTerrain();

        // create trees
        this.createTrees();

        // create rocks
        this.createRocks();

        }



        clear(){

            if(this.terrain){
                this.terrain.geometry.dispose();
                this.terrain.material.dispose();
                this.remove(this.terrain);
            }

            if(this.trees){
                this.trees.children.forEach(tree => {
                    tree.geometry.dispose();
                    tree.material.dispose();
                });
                this.trees.clear();
            }
            
            // clear rocks
            if(this.rocks){
                this.rocks.children.forEach(rock => {
                    rock.geometry.dispose();
                    rock.material.dispose();
                });
                this.rocks.clear();
            }
        }



        createTerrain(){

            
        gridTexture.repeat = new THREE.Vector2(this.width, this.height);
        gridTexture.wrapS = THREE.RepeatWrapping;
        gridTexture.wrapT = THREE.RepeatWrapping;
        gridTexture.colorSpace = THREE.SRGBColorSpace;
        
        const TerrainGeometry = new THREE.PlaneGeometry(this.width, this.height , this.width, this.height);
        const TerrainMaterial = new THREE.MeshStandardMaterial({map: gridTexture });
        this.terrain = new THREE.Mesh(TerrainGeometry, TerrainMaterial);
        this.terrain.rotation.x = -Math.PI / 2; // Rotate the plane to be horizental
        this.terrain.position.set(this.width / 2, 0, this.height / 2);
        this.add(this.terrain);
    }


    // function to create trees

    createTrees() {

        const treeHeight = 1.2;
        const treeRadius = 0.2; 

        

        this.trees = new THREE.Group();
        this.add(this.trees);

        for(let i = 0; i < this.treeCount; i++) {
            
            const treeGeometry = new THREE.ConeGeometry(treeRadius, treeHeight, 8);
            const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x26cf42 , flatShading: true }); // Brown color for the trunk

            const treeMesh = new THREE.Mesh(treeGeometry, treeMaterial);
            treeMesh.position.set(Math.floor(Math.random() * this.width) +0.5, treeHeight / 2, Math.floor(Math.random() * this.height)+0.5);
            this.trees.add(treeMesh);
        }
    }

    // function to create Rocks
    createRocks() {

        const minRockRadius = 0.2;
        const maxRockRadius = 0.4; 
        const minRockHeight = 0.5;
        const maxRockHeight = 0.7;
        const rockHeight = minRockHeight + Math.random() * (maxRockHeight - minRockHeight);
        
        const rockMaterial = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 , flatShading: true }); // Brown color for the trunk

      

        this.rocks = new THREE.Group();
        this.add(this.rocks);

        for(let i = 0; i < this.rocksCount; i++) {

            const radius = minRockRadius + Math.random() * (maxRockRadius - minRockRadius);

            const rockGeometry = new THREE.SphereGeometry(radius, 5, 6);
            const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
            rockMesh.position.set(Math.floor(Math.random() * this.width) +0.5,0, Math.floor(Math.random() * this.height)+0.5);

            // rgler la hauteur de la roche
            rockMesh.scale.y=rockHeight;
            this.rocks.add(rockMesh);
        }
    }


    }

    

    
