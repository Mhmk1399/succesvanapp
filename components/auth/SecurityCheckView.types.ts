export type SecurityCheckViewProps = {
  url: string;
  onMessage: (message: unknown) => void;
  onError: () => void;
};
