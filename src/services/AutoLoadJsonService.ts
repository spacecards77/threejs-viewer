// AutoLoadJsonService: responsible for fetching a JSON file from the public folder,
// deserializing it to a Construction and drawing it via DrawService.
import {JsonService} from './JsonService';
import type {Construction} from '../model';
import {AssertUtils} from "../utils/assert/AssertUtils.ts";

export class AutoLoadJsonService {
    private readonly jsonService: JsonService;
    private onConstructionLoaded?: (construction: Construction | null) => void;

    constructor(onConstructionLoaded?: (construction: Construction | null) => void) {
        this.jsonService = new JsonService();
        this.onConstructionLoaded = onConstructionLoaded;
    }

    public async tryAutoload(url: string): Promise<void> {
        if (!url || url.trim() === '') return;

        const normalized = url.startsWith('/') ? url : `/${url}`;
        try {
            const resp = await fetch(normalized);
            AssertUtils.isTrue(resp.ok,`Failed to fetch ${normalized}: ${resp.status} ${resp.statusText}`);

            const text = await resp.text();
            const construction: Construction = this.jsonService.deserialize(text);
            this.onConstructionLoaded?.(construction);
        } catch (err) {
            console.error('AutoLoadJsonService: autoload failed', err);
            if (typeof window !== 'undefined') {
                // user-visible notification
                alert(`Ошибка автозагрузки модели: ${err}`);
            }
            // Notify caller about the failure
            this.onConstructionLoaded?.(null);
        }
    }
}
