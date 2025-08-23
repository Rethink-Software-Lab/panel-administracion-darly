export type ResultPattern =
  | {
      data: string;
      error: null;
    }
  | { data: null; error: string };
