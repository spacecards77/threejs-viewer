import { SceneService } from './services/SceneService.ts';
import { Construction } from "./entities";
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
        this.drawService = this.sceneService.getDrawService();

        new LoadJsonUiController((construction: Construction | null) => {
            if (construction) {
                this.construction = construction;
                this.drawService.drawConstruction(this.construction);
            } else {
                // handle null case if needed (error already shown in controller)
                this.construction = null;
            }
        });

        // If configured to autoload a JSON path, try to fetch and draw it now.
        const path = config.autoLoadJson?.trim();
        if (path) {
            const auto = new AutoLoadJsonService(this.drawService);
            void auto.tryAutoload(path);
        }
    }
}
