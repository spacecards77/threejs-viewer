export interface NodeJSON {
  ID: number;
  X: number;
  Y: number;
  Z: number;
}

export class Node {
  public readonly id: number;
  public readonly x: number;
  public readonly y: number;
  public readonly z: number;

  /**
   * Accepts either a JSON object produced from the original C# serialization (with keys ID,X,Y,Z)
   * or an already-typed object with lowercase keys.
   */
  constructor(data: NodeJSON | { id: number; x: number; y: number; z: number }) {
    if ((data as any).ID !== undefined) {
      const d = data as NodeJSON;
      this.id = d.ID;
      this.x = d.X;
      this.y = d.Y;
      this.z = d.Z;
    } else {
      const d = data as { id: number; x: number; y: number; z: number };
      this.id = d.id;
      this.x = d.x;
      this.y = d.y;
      this.z = d.z;
    }
  }

  static fromJSON(json: any): Node {
    return new Node(json);
  }
}
