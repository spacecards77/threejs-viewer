import { SceneService } from './SceneService';
import { Construction } from "../entities";
import type {DrawService} from "./DrawService.ts";
import { LoadJsonUiController } from './LoadJsonUiController';

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
    }
}
