import { downloadWithMime } from '@thi.ng/dl-asset'
import { CAPTURE_SIZE, features } from './settings'
import { piece } from './piece'
import packageJson from './../package.json'
import { createImageFromSVG, setupCanvas } from './utils'

const init = async () => {
  document.getElementById('container')!.innerHTML = piece
}

const initPreview = async () => {
  const img = await createImageFromSVG(piece)
  const width = img.width > img.height ? CAPTURE_SIZE : Math.round(CAPTURE_SIZE * (img.width / img.height))
  const height = img.height > img.width ? CAPTURE_SIZE : Math.round(CAPTURE_SIZE * (img.height / img.width))
  const [canvas, ctx] = setupCanvas(width, height)
  canvas.id = 'preview'
  document.getElementById('container')!.appendChild(canvas)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(() => window.$fx.preview())
}

window.onkeydown = async (e) => {
  switch (e.key) {
    case 's':
      downloadWithMime(
        `${packageJson.author.id}-${packageJson.config.id}-${window.$fx.iteration}-${window.$fx.hash}.svg`,
        piece,
        { mime: 'image/svg+xml' },
      )
      break
    case 'p':
      const img = await createImageFromSVG(piece)
      const [canvas, ctx] = setupCanvas(img.width, img.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          downloadWithMime(
            `${packageJson.author.id}-${packageJson.config.id}-${window.$fx.iteration}-${window.$fx.hash}.png`,
            blob,
            { mime: 'image/png' },
          )
        }
      })
      break
    case 'h':
      [...document.getElementsByTagName('text')].map(
        (e) => e.style.display = e.style.display == 'none' ? 'block' : 'none',
      )
      break
  }
}

window.$fx.features({ ...features})

window.$fx.isPreview || window.$fx.context === 'capture' ? initPreview() : init()

console.info(packageJson.config.title)
console.info(packageJson.description)
console.info(packageJson.config.additionalDescription)
console.info(`${packageJson.author.name}, ${packageJson.author.url}`)
console.info(`FXHASH: ${window.$fx.hash}`)
console.info(`FXMINTER: ${window.$fx.minter}`)
console.info(JSON.stringify(window.$fx.getFeatures(), null, 2))
