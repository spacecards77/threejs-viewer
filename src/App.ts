import { SceneService } from './services/SceneService.ts';
import { Construction } from "./model";
import type {DrawService} from "./services/DrawService.ts";
import { LoadJsonUiController } from './services/LoadJsonUiController.ts';
import { config } from './config.ts';
import { AutoLoadJsonService } from './services/AutoLoadJsonService.ts';

export class App {
    private readonly sceneService: SceneService;
    private readonly drawService: DrawService;
    private construction: Construction | null = null;

    constructor() {
        this.sceneService = new SceneService();
        this.drawService = this.sceneService.drawService;

        // Create a single callback handler and pass it to both the UI loader and the auto-loader
        new LoadJsonUiController(this.handleConstructionLoaded);

        // If configured to autoload a JSON path, try to fetch and draw it now.
        const path = config.debugMode ? config.autoLoadJson?.trim() : '';
        if (path) {
            const auto = new AutoLoadJsonService(this.handleConstructionLoaded);
            void auto.tryAutoload(path);
        }
    }

    // Unified callback used by both LoadJsonUiController and AutoLoadJsonService.
    // It delegates to processConstruction when a valid construction is provided,
    // otherwise clears the current construction (controller already shows errors).
    private handleConstructionLoaded = (construction: Construction | null): void => {
        if (construction) {
            this.processConstruction(construction);
        } else {
            this.construction = null;
        }
    };

    private processConstruction(construction: Construction) {
        this.construction = construction;
        //должно быть до отрисовки Ui, чтобы привязать статические оси к позиции на экране
        this.sceneService.setupCameras(construction.geometry);
        this.drawService.addConstructionToScene(this.construction);
        this.sceneService.prepareModelViewer(construction.geometry);
    }
}
