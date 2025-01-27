// copied from https://github.com/ILPN/Abschlussarbeit-model-repair-with-partial-orders

export type PnmlWrapper = {
  pnml: {
    net: {
      page?: PnmlPage;
    } & PnmlPage;
  };
};

export type PnmlPage = {
  arc: PnmlArc[];
  place: PnmlPlace[];
  transition: PnmlTransitions[];
};

type PnmlArc = {
  source: string;
  target: string;
  inscription: {
    text: number;
  };
};

type PnmlPlace = {
  id: string;
  name: {
    text: string;
  };
  initialMarking: {
    text: number;
  };
};

type PnmlTransitions = {
  id: string;
  name?: {
    text?: string;
  };
};
