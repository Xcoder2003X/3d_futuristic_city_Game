import * as THREE from 'three';


export class CharacterController {
    constructor(character, camera, scene) {
        this.character = character;
        this.camera = camera;
        this.scene = scene;
        this.position = new THREE.Vector3(0, 0, 0);
        
        if (!this.character) {
            console.error('No character model provided to CharacterController');
            return;
        }
        
        // Debug: Log character information
        console.log('Character loaded in controller:', {
            position: this.character.position,
            visible: this.character.visible,
            hasAnimations: this.character.animations?.length > 0,
            children: this.character.children.length
        });
        // Movement properties
        this.moveSpeed = 5;
        this.rotationSpeed = 3;
        this.isMoving = false;
        this.isRunning = false;
        this.isSitting = false;
        this.lastMovementTime = Date.now();
        
        // Camera properties
        this.cameraDistance = 10;
        this.cameraHeight = 5;
        this.cameraOffset = new THREE.Vector3(0, this.cameraHeight, this.cameraDistance);
        this.cameraLookAtOffset = new THREE.Vector3(0, .2, 0);
        
        // Input state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false,    // For running
            space: false,    // For jumping
            c: false        // For sitting
        };


        // Raycaster pour la détection du terrain
        this.raycaster = new THREE.Raycaster();
        this.downVector = new THREE.Vector3(0, -1, 0);
        
        // Character orientation
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.animations = [];
        // Animation mixer (if your GLB has animations)
        this.mixer = null;
        this.actions = {
            idle: null,
            jump: null,
            run: null,
            sittingEnd: null,
            sittingStart: null,
            staticPose: null,
            walk: null,
            turningLeft: null,
            turningRight: null
        };
        
        this.setupEventListeners();
        // Don't setup animations yet, wait for them to be loaded
        this.animationsLoaded = false;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }
    
    setAnimations(animations) {
        console.log('Setting animations:', animations);
        if (animations && animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.character);
            
            // Setup all animations
            const animationMap = {
                idle: 'Rig|idle',
                jump: 'Rig|jump',
                run: 'Rig|run',
                sittingEnd: 'Rig|sitting_end',
                sittingStart: 'Rig|sitting_start',
                staticPose: 'Rig|Static_Pose',
                walk: 'Rig|walk',
                turningLeft: 'Rig|turning_left',
                turningRight: 'Rig|turning_right'
            };
            
            // Create animation actions
            for (const [key, animationName] of Object.entries(animationMap)) {
                const clip = THREE.AnimationClip.findByName(this.character.animations, animationName);
                if (clip) {
                    this.actions[key] = this.mixer.clipAction(clip);
                    if (key === 'staticPose') {
                        this.actions[key].play(); // Start with static pose
                    }
                }
            }
            console.log('Animations setup complete:', this.actions);
        }
    }
    
    onKeyDown(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = true;
                this.isRunning = true;
                break;
            case 'Space':
                if (!this.keys.space) {  // Prevent holding space
                    this.keys.space = true;
                    this.handleJump();
                }
                break;
            case 'KeyC':
                if (!this.keys.c) {  // Toggle sitting
                    this.keys.c = true;
                    this.isSitting = !this.isSitting;  // Toggle sitting state
                    if (!this.isSitting) {
                        // Reset any sitting animations when standing up
                        this.fadeToAction('staticPose', 0.2);
                    }
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = false;
                this.isRunning = false;
                break;
            case 'Space':
                this.keys.space = false;
                break;
            case 'KeyC':
                this.keys.c = false;
                break;
        }
    }
    
    handleJump() {
        if (this.actions.jump && !this.isSitting) {
            // Don't allow jumping while sitting
            this.fadeToAction('jump', 0.1);
            // Return to previous state after jump animation
            setTimeout(() => {
                if (this.isMoving) {
                    this.fadeToAction(this.isRunning ? 'run' : 'walk', 0.2);
                } else {
                    this.fadeToAction('staticPose', 0.2);
                }
            }, 1000); // Adjust timeout based on jump animation length
        }
    }
    
    update(deltaTime) {
        this.handleMovement(deltaTime);
        this.updateAnimations(deltaTime);
        this.updateCamera(deltaTime);
    }
    
    handleMovement(deltaTime) {
        const moveVector = new THREE.Vector3();
        let shouldMove = false;
        
        // Calculate movement direction
        if (this.keys.forward) {
            moveVector.z -= 1;
            shouldMove = true;
        }
        if (this.keys.backward) {
            moveVector.z += 1;
            shouldMove = true;
        }
        
        // Handle rotation (turning left/right)
        if (this.keys.left) {
            this.targetRotation += this.rotationSpeed * deltaTime;
        }
        if (this.keys.right) {
            this.targetRotation -= this.rotationSpeed * deltaTime;
        }
        
        // Smooth rotation interpolation
        this.currentRotation = THREE.MathUtils.lerp(
            this.currentRotation, 
            this.targetRotation, 
            10 * deltaTime
        );
        
        // Apply rotation to character
        this.character.rotation.y = this.currentRotation;
        // Position temporaire pour vérification
        const newPosition = this.character.position.clone();
        
        // Ground detection raycast
        const groundRayStart = new THREE.Vector3(newPosition.x, newPosition.y + 0.5, newPosition.z);
        this.raycaster.set(groundRayStart, this.downVector);
        
        // Forward collision detection
        const forwardDirection = new THREE.Vector3();
        if (this.keys.forward) forwardDirection.z = -1;
        if (this.keys.backward) forwardDirection.z = 1;
        forwardDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);
        
        const collisionRayStart = this.character.position.clone();
        collisionRayStart.y += .4; // Check at character's middle height
        this.raycaster.set(collisionRayStart, forwardDirection);
        
        // Check for collisions first
        const collisions = this.raycaster.intersectObjects(this.scene.children.filter(obj => 
            obj !== this.character && 
            !this.character.getObjectById(obj.id) &&
            obj.type !== "Light" &&
            obj.type !== "Camera"
        ), true);
        
        // If there's a collision within 1 unit, prevent movement
        const collision = collisions.find(c => c.distance < 1 && c.object.isMesh);
        if (collision) {
            console.log("Collision detected!");
            shouldMove = false;
        }
        
        // Ground detection
        this.raycaster.set(groundRayStart, this.downVector);

        // Filter out the character and its children from raycast
        const sceneObjects = this.scene.children.filter(obj => {
            return obj !== this.character && 
                   !this.character.getObjectById(obj.id) &&
                   obj.type !== "Light" && // Ignore lights
                   obj.type !== "Camera"; // Ignore cameras
        });
        
        const intersects = this.raycaster.intersectObjects(sceneObjects, true);
        console.log("Found", intersects.length, "intersections");
        
        if (intersects.length > 0) {
            // Trouver la première intersection avec un objet solide
            const groundIntersect = intersects.find(intersect => 
                intersect.object.isMesh && 
                intersect.object !== this.character &&
                !intersect.object.userData.isDecorative // Si vous avez des objets décoratifs à ignorer
            );

            if (groundIntersect) {
                // Set character height to be slightly above ground
                const targetY = groundIntersect.point.y ; // Keep slightly above ground
                
                // Smooth transition to new height
                newPosition.y = THREE.MathUtils.lerp(
                    this.character.position.y,
                    targetY,
                    0.1 // Adjust this value to change how quickly height changes
                );                console.log("Ground found at:", groundIntersect.point.y, "Setting height to:", newPosition.y);
            }
        } else {
            console.log("No ground found!");
        }

        // Apply the new position
        this.character.position.copy(newPosition);

        
        // Move character if there's input
        if (shouldMove) {
            // Normalize movement vector
            moveVector.normalize();

            // Apply character's rotation to movement vector
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.currentRotation);

            // Adjust speed if running
            let speed = this.moveSpeed;
            if (this.isRunning) {
                speed = this.moveSpeed * 2; // Augmente la vitesse de course (ajuste le facteur si besoin)
            }

            // Apply movement
            this.character.position.add(
                moveVector.multiplyScalar(speed * deltaTime)
            );

            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
    }
    
    updateAnimations(deltaTime) {
        if (!this.mixer) return;
        
        this.mixer.update(deltaTime);
        const currentTime = Date.now();
        
        // Handle all animations
        if (this.isMoving) {
            this.lastMovementTime = currentTime;
            
            // Handle running vs walking
            if (this.isRunning && this.actions.run) {
                this.fadeToAction('run', 0.2);
            } else if (this.actions.walk) {
                this.fadeToAction('walk', 0.2);
            }
            
            // Handle turning animations
            if (this.keys.left && this.actions.turningLeft) {
                this.fadeToAction('turningLeft', 0.2);
            } else if (this.keys.right && this.actions.turningRight) {
                this.fadeToAction('turningRight', 0.2);
            }
        } else {
            // Handle sitting animation
            if (this.isSitting) {
                if (this.actions.sittingStart && !this.actions.sittingStart.isRunning()) {
                    this.fadeToAction('sittingStart', 0.2);
                    setTimeout(() => {
                        if (this.isSitting) this.fadeToAction('sittingEnd', 0.2);
                    }, 1000); // Transition to sitting end after animation
                }
            } else {
                // Handle idle animations
                const timeSinceLastMove = currentTime - this.lastMovementTime;
                if (timeSinceLastMove > 60000 && this.actions.idle) { // 1 minute
                    this.fadeToAction('idle', 0.5);
                } else if (this.actions.staticPose) {
                    this.fadeToAction('staticPose', 0.2);
                }
            }
        }
    }
    
    fadeToAction(actionName, duration) {
        const newAction = this.actions[actionName];
        if (!newAction || newAction.isRunning()) return;

        // Fade out all current actions
        Object.values(this.actions).forEach(action => {
            if (action && action.isRunning()) {
                action.fadeOut(duration);
            }
        });

        // Start new action
        newAction.reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();
    }
    
    updateCamera(deltaTime) {
        // Calculate camera position relative to character
        const characterPosition = this.character.position.clone();
        const characterRotation = this.character.rotation.y;
        
        // Calculate offset position based on character rotation
        const offsetPosition = this.cameraOffset.clone();
        offsetPosition.applyAxisAngle(new THREE.Vector3(0, 1, 0), characterRotation);
        
        // Set camera position
        const targetCameraPosition = characterPosition.clone().add(offsetPosition);
        
        // Smooth camera movement
        this.camera.position.lerp(targetCameraPosition, 5 * deltaTime);
        
        // Calculate look-at position
        const lookAtPosition = characterPosition.clone().add(this.cameraLookAtOffset);
        this.camera.lookAt(lookAtPosition);
    }
    
    // Method to set character position
    setPosition(x, y, z) {
        this.character.position.set(x, y, z);
    }
    
    // Method to set camera distance
    setCameraDistance(distance) {
        this.cameraDistance = distance;
        this.cameraOffset.z = distance;
    }
    
    // Method to set camera height
    setCameraHeight(height) {
        this.cameraHeight = height;
        this.cameraOffset.y = height;
    }
    
    // Method to set movement speed
    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }
    
    // Method to set rotation speed
    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }
    
    // Cleanup method
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
}