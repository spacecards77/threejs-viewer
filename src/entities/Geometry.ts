import { Member } from './Member';
import { Node } from './Node';

export interface GeometryJSON {
  Members: any[]; // MemberJSON[] but accept any to be flexible
  Nodes: any[]; // NodeJSON[]
}

export class Geometry {
  public readonly idToNode: Map<number, Node>;
  public readonly members: Member[];
  public readonly nodes: Node[];

  constructor(members: Member[], nodes: Node[]) {
    this.members = members;
    this.nodes = nodes;
    this.idToNode = new Map<number, Node>(nodes.map(n => [n.id, n]));
  }

  static fromJSON(json: GeometryJSON): Geometry {
    const nodes = (json.Nodes || []).map(n => Node.fromJSON(n));
    const members = (json.Members || []).map(m => Member.fromJSON(m));
    return new Geometry(members, nodes);
  }
}
