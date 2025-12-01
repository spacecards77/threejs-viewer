// filepath: c:\projects\PGS\babylonjs-viewer\src\services\JsonService.ts
import { Construction } from '../entities';

/**
 * JsonService is responsible for converting a JSON string (in the expected schema)
 * into a strongly-typed Construction domain object.
 */
export class JsonService {
  /**
   * Deserialize a JSON string into a Construction instance.
   * The expected input shape is compatible with the provided example, e.g.:
   * {
   *   "Geometry": { "Nodes": [...], "Members": [...] },
   *   "Materials": {}, "Constraints": {}, "Releases": {}
   * }
   */
  deserialize(json: string): Construction {
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (e: any) {
      const msg = e && e.message ? e.message : String(e);
      throw new Error(`Invalid JSON: ${msg}`);
    }

    const geometryJson = parsed?.Geometry ?? {};

    const normalizedGeometry = {
      Nodes: Array.isArray(geometryJson.Nodes) ? geometryJson.Nodes : [],
      Members: Array.isArray(geometryJson.Members) ? geometryJson.Members : [],
    };

    // Build Construction using existing entity factories
    // Prefer the provided factory for consistency
    return Construction.fromJSON({ Geometry: normalizedGeometry } as any);
  }
}
