import { Geometry } from './Geometry';
import type {Object3D} from "three";

export interface ConstructionJSON {
  Geometry: any; // GeometryJSON
}

export class Construction {
  public readonly geometry: Geometry;
  public Parent: Object3D | null = null;

  constructor(geometry: Geometry) {
    this.geometry = geometry;
  }

  static fromJSON(json: ConstructionJSON): Construction {
    return new Construction(Geometry.fromJSON(json.Geometry));
  }
}
