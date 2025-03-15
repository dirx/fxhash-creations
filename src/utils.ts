import { css, type ReadonlyColor } from '@thi.ng/color'

export const createImageFromSVG = (svgContent: string): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.style.imageRendering = 'smooth'
    img.onload = () => resolve(img)
    img.src = 'data:image/svg+xml;base64,' + btoa(svgContent)
  })
}

export const setupCanvas = (width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = width
  canvas.height = height
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return [canvas, ctx]
}

export const logColor = (c: string | ReadonlyColor, msg: string = '') =>
  console.info(
    `%c${msg}       ${css(c)}`,
    `background-color: ${css(c)}; color:#ffffff; padding: 2px;`,
  )
