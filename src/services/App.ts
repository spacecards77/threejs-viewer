import { SceneService } from './SceneService';

export class App {
    private sceneService: SceneService;

    constructor() {
        this.sceneService = new SceneService();
    }

    public getSceneService(): SceneService {
        return this.sceneService;
    }
}

