// AutoLoadJsonService: responsible for fetching a JSON file from the public folder,
// deserializing it to a Construction and drawing it via DrawService.
import { JsonService } from './JsonService';
import { DrawService } from './DrawService';
import type { Construction } from '../entities';

export class AutoLoadJsonService {
    private readonly jsonService: JsonService;
    private readonly drawService: DrawService;

    constructor(drawService: DrawService) {
        this.jsonService = new JsonService();
        this.drawService = drawService;
    }

    /**
     * Attempt to fetch and draw the JSON model at `url`.
     * `url` can be '/modelData.json' or 'modelData.json' (we normalize it to start with '/').
     */
    public async tryAutoload(url: string): Promise<void> {
        if (!url || url.trim() === '') return;

        const normalized = url.startsWith('/') ? url : `/${url}`;
        try {
            const resp = await fetch(normalized);
            if (!resp.ok) {
                throw new Error(`Failed to fetch ${normalized}: ${resp.status} ${resp.statusText}`);
            }

            const text = await resp.text();
            const construction: Construction = this.jsonService.deserialize(text);
            if (construction) {
                this.drawService.drawConstruction(construction as any);
                console.info(`Auto-loaded and drew construction from ${normalized}`);
            }
        } catch (err) {
            console.error('AutoLoadJsonService: autoload failed', err);
            if (typeof window !== 'undefined') {
                // user-visible notification
                alert(`Ошибка автозагрузки модели: ${err}`);
            }
        }
    }
}

