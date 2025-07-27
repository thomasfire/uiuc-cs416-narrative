const SCENE_MIN = 1;
const SCENE_MAX = 5;

class SceneControl {
    constructor() {
        if (SceneControl.instance) {
            return SceneControl.instance;
        }

        this.currentScene = SCENE_MIN;

        SceneControl.instance = this;
        return this;
    }

    prev_available() {
        return this.currentScene > SCENE_MIN;
    }

    next_available() {
        return this.currentScene < SCENE_MAX;
    }

    next() {
        if (this.next_available()) {
            this.currentScene++;
            this.updateScene();
        }
    }

    prev() {
        if (this.prev_available()) {
            this.currentScene--;
            this.updateScene();
        }
    }

    updateScene() {
        // Hide all scenes
        const scenes = document.querySelectorAll('div.scene');
        scenes.forEach(scene => {
            scene.style.display = 'none';
        });

        // Show a current scene
        const currentSceneElement = document.getElementById(`scene_${this.currentScene}`);
        if (currentSceneElement) {
            currentSceneElement.style.display = 'block';
        }

        this.updateButtonStates();
        this.updateVisualization();
    }

    updateVisualization() {
        if (typeof updateScene !== 'undefined') {
            if (typeof currentScene !== 'undefined') {
                window.currentScene = this.currentScene;
            }
            updateScene();
        }
    }

    updateButtonStates() {
        const prevButton = document.getElementById('prev');
        const nextButton = document.getElementById('next');

        if (prevButton) {
            prevButton.disabled = !this.prev_available();
            if (this.prev_available()) {
                prevButton.classList.remove('disabled');
            } else {
                prevButton.classList.add('disabled');
            }
        }

        if (nextButton) {
            nextButton.disabled = !this.next_available();
            if (this.next_available()) {
                nextButton.classList.remove('disabled');
            } else {
                nextButton.classList.add('disabled');
            }
        }
    }

    init() {
        this.updateScene();

        const prevButton = document.getElementById('prev');
        const nextButton = document.getElementById('next');

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.prev();
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.next();
            });
        }
    }
}

const sceneControl = new SceneControl();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sceneControl;
}