import { Geometry } from './Geometry';

export interface ConstructionJSON {
  Geometry: any; // GeometryJSON
}

export class Construction {
  public readonly geometry: Geometry;

  constructor(geometry: Geometry) {
    this.geometry = geometry;
  }

  static fromJSON(json: ConstructionJSON): Construction {
    return new Construction(Geometry.fromJSON(json.Geometry));
  }
}
