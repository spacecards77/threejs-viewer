import { JsonService } from './JsonService';
import { Construction } from '../entities';

export class LoadJsonUiController {
    private readonly loadBtn: HTMLButtonElement | null;
    private readonly fileInput: HTMLInputElement | null;
    private readonly onConstructionLoaded: (construction: Construction | null) => void;
    private readonly jsonService: JsonService;

    constructor(onConstructionLoaded: (construction: Construction | null) => void, loadBtnId = 'loadJsonBtn', fileInputId = 'jsonFileInput') {
        this.onConstructionLoaded = onConstructionLoaded;
        this.jsonService = new JsonService();
        this.loadBtn = document.getElementById(loadBtnId) as HTMLButtonElement;
        this.fileInput = document.getElementById(fileInputId) as HTMLInputElement;

        if (!this.loadBtn || !this.fileInput) {
            console.error('LoadJsonUiController: UI elements not found');
            return;
        }

        this.loadBtn.addEventListener('click', this.handleLoadClick);
        this.fileInput.addEventListener('change', this.handleFileChange);
    }

    private handleLoadClick = (): void => {
        this.fileInput?.click();
    };

    private handleFileChange = (event: Event): void => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            this.loadAndParseFile(file);
        }
    };

    private loadAndParseFile(file: File): void {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const jsonString = event.target?.result as string;
                const construction = this.jsonService.deserialize(jsonString);
                this.onConstructionLoaded(construction ?? null);
            } catch (error) {
                console.error('Error loading JSON file:', error);
                alert(`Ошибка загрузки файла: ${error}`);
                this.onConstructionLoaded(null);
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            alert('Ошибка чтения файла');
            this.onConstructionLoaded(null);
        };

        reader.readAsText(file);
    }

    public dispose(): void {
        if (this.loadBtn) this.loadBtn.removeEventListener('click', this.handleLoadClick);
        if (this.fileInput) this.fileInput.removeEventListener('change', this.handleFileChange);
    }
}
