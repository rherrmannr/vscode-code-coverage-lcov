export interface Trace {
  line: number;
  address: number[];
  length: number;
  stats: {
    Line: number;
  };
  fn_name: string | null;
}

export interface File {
  path: string[];
  content: string;
  traces: Trace[];
  covered: number;
  coverable: number;
}

export interface TarpulinData {
  files: File[];
}
