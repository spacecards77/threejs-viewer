import { SceneService } from './SceneService';
import { JsonService } from './JsonService';
import { Construction } from "../entities";

export class App {
    private sceneService: SceneService;
    private jsonService: JsonService;
    private construction: Construction | null = null;

    constructor() {
        this.sceneService = new SceneService();
        this.jsonService = new JsonService();
    }

    public getSceneService(): SceneService {
        return this.sceneService;
    }

    public getConstruction(): Construction | null {
        return this.construction;
    }

    public setupUI(): void {
        const loadBtn = document.getElementById('loadJsonBtn') as HTMLButtonElement;
        const fileInput = document.getElementById('jsonFileInput') as HTMLInputElement;

        if (!loadBtn || !fileInput) {
            console.error('UI elements not found');
            return;
        }

        loadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];

            if (file) {
                this.loadJsonFile(file);
            }
        });
    }

    private loadJsonFile(file: File): void {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const jsonString = event.target?.result as string;
                this.construction = this.jsonService.deserialize(jsonString);
                console.log('Construction loaded successfully:', this.construction);
            } catch (error) {
                console.error('Error loading JSON file:', error);
                alert(`Ошибка загрузки файла: ${error}`);
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            alert('Ошибка чтения файла');
        };

        reader.readAsText(file);
    }
}

