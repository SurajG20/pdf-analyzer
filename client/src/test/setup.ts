import '@testing-library/jest-dom/vitest'

// jsdom does not implement matchMedia (used by the theme hook).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom does not implement Blob.arrayBuffer — polyfill via FileReader so the
// drop zone's magic-byte check can run in tests.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}

// pdf.js requires DOMMatrix at import time; jsdom does not provide it.
if (typeof DOMMatrix === 'undefined') {
  class DOMMatrixStub {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    m: number[] = [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    constructor(init?: string | number[]) {
      if (Array.isArray(init)) this.m = init
    }
    multiplySelf() { return this }
    inverse() { return this }
    transformPoint(p: { x: number; y: number }) { return { x: p.x, y: p.y } }
    static fromMatrix() { return new DOMMatrixStub() }
    static fromFloat32Array() { return new DOMMatrixStub() }
    static fromFloat64Array() { return new DOMMatrixStub() }
  }
  ;(globalThis as { DOMMatrix: unknown }).DOMMatrix = DOMMatrixStub
}

// Keep jsdom output quiet by stubbing canvas rendering.
HTMLCanvasElement.prototype.getContext = (() => null) as never

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub