declare global {
interface Window {
  JABIYEN_FONTS?: { families: { heading: string; subtitle: string; body: string }; cssVariables: Record<string, string> };
  JsBarcode?: (element: SVGSVGElement, value: string, options?: Record<string, string | number | boolean>) => void;
}
}

export {};
