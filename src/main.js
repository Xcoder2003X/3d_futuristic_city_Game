import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui'; 
import { Terrain } from './Terrain.js';
import { Player } from './player.js';

const gui = new GUI();

// Import the Terrain class

const terrain = new Terrain(10, 10);

// import the player

const player = new Player('characters/char1.glb');

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( devicePixelRatio );
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// include Terrain ,player inside our scene
scene.add(terrain);
scene.add(player);

const controls = new OrbitControls( camera, renderer.domElement );

controls.target.set(5 ,0 ,5);
camera.position.set( 0, 2, 0 );
controls.update();


const sun = new THREE.DirectionalLight();
sun.position.set( 1,2,3);
sun.intensity = 5;
scene.add( sun );

const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
ambientLight.intensity = 1;
scene.add( ambientLight );


const stats = new Stats()
document.body.appendChild(stats.dom)

/*const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );*/


// GUI controls for the elements
/*const folder = gui.addFolder('Cube Properties');
folder.add(cube.position, 'x', -5, 5).name('Position X');
folder.addColor(cube.material, 'color').name('Cube Color');*/

// for terrain

const Terrainfolder = gui.addFolder('Terrain Properties');
Terrainfolder.add(terrain, "width", 1, 20, 1).name('Terrain Width');
Terrainfolder.add(terrain , "height", 1, 20, 1).name('Terrain height');
Terrainfolder.addColor(terrain.material, 'color').name('Terrain Color');
Terrainfolder.add(terrain , "genereteWorld").name('Regenerate Terrain');
Terrainfolder.onChange(() => {
  terrain.createTerrain();
})



function animate() {

  controls.update();

  stats.update()

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

window.addEventListener( 'resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
});