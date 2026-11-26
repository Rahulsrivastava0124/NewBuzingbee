import type { CSSProperties, ReactNode, JSX } from "react";

// Types for the React Bits Counter (Counter.jsx); every prop is optional.
export type CounterProps = {
  value?: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  decimals?: number;
  minDigits?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  direction?: "auto" | "up" | "down" | "shortest";
  duration?: number;
  bounce?: number;
  stagger?: number;
  motionBlur?: boolean;
  intro?: boolean;
  fade?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  textColor?: string;
  gap?: number;
  padding?: number;
  tabular?: boolean;
  digitStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
};

declare function Counter(props: CounterProps): JSX.Element;
export default Counter;
