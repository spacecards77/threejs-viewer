export interface MemberJSON {
  ID: number;
  N1: number;
  N2: number;
}

export class Member {
  public readonly id: number;
  public readonly node1Id: number;
  public readonly node2Id: number;

  constructor(data: MemberJSON | { id: number; node1Id: number; node2Id: number }) {
    if ((data as any).ID !== undefined) {
      const d = data as MemberJSON;
      this.id = d.ID;
      this.node1Id = d.N1;
      this.node2Id = d.N2;
    } else {
      const d = data as { id: number; node1Id: number; node2Id: number };
      this.id = d.id;
      this.node1Id = d.node1Id;
      this.node2Id = d.node2Id;
    }
  }

  static fromJSON(json: any): Member {
    return new Member(json);
  }
}
