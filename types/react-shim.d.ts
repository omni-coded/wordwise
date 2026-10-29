// Minimal typings for React 19, used only to type-check src/ui in environments where @types/react
// cannot be installed. With the real @types/react installed, delete this file and tsconfig.ui.json's "files" entry.
declare module 'react' {
  export type ReactNode = unknown;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export type RefObject<T> = { current: T };
  export interface PointerEvent<T = Element> {
    clientX: number; clientY: number; pointerId: number; pointerType: string; button: number;
    currentTarget: T & { setPointerCapture(id: number): void; releasePointerCapture(id: number): void };
    preventDefault(): void; stopPropagation(): void;
  }
  export interface KeyboardEvent<T = Element> {
    key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean;
    currentTarget: T; preventDefault(): void; stopPropagation(): void;
  }
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useRef<T>(initial: T): { current: T };
  export function useRef<T>(initial: T | null): RefObject<T | null>;
  export function useRef<T = undefined>(): { current: T | undefined };
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: never[]) => unknown>(fn: T, deps: readonly unknown[]): T;
  export function useContext<T>(ctx: Context<T>): T;
  export interface Context<T> { Provider: (props: { value: T; children?: ReactNode }) => unknown; _t?: T }
  export function createContext<T>(def: T): Context<T>;
  export function memo<P>(c: (props: P) => unknown): (props: P) => unknown;
}
declare module 'react/jsx-runtime' {
  export const jsx: unknown; export const jsxs: unknown; export const Fragment: unknown;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(node: unknown): void };
}
declare module '*.css';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare namespace JSX {
  type Element = unknown;
  interface DOMAttrs {
    [attr: string]: any;
    onClick?: (e: any) => void; onFocus?: (e: any) => void; onChange?: (e: any) => void; onInput?: (e: any) => void; onBlur?: (e: any) => void;
    onMouseDown?: (e: any) => void; onKeyDown?: (e: any) => void; onContextMenu?: (e: any) => void;
    onPointerDown?: (e: any) => void; onPointerMove?: (e: any) => void; onPointerUp?: (e: any) => void; onPointerCancel?: (e: any) => void;
  }
  interface IntrinsicElements { [tag: string]: DOMAttrs; }
  interface IntrinsicAttributes { key?: string | number | null }
  interface ElementChildrenAttribute { children: unknown }
}
