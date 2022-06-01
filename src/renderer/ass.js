const path = require('path')
const fs = require('fs')
const readline = require('readline')
const { spawn } = require('child_process')
const { promisify } = require('util')
const events = require('events')

const dummyASSHeader = (style) => {
  const { fontName, fontSize, fontColor, shadowColor } = style
  return `[Script Info]
Title: Default Aegisub file
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${hexColorToASSColor(fontColor)},&H000E0EBF,&H00FFFFFF,${hexColorToASSColor(shadowColor)},1,0,0,0,100,100,0,0,1,0,0,2,10,10,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`
}

const dialoguePattern = /^Dialogue: [^,]+(,[^,]+,[^,]+,([^,]*),[^,]*,\d+,\d+,\d+,[^,]*,)(.*)$/

const tempASSPath = path.resolve(__static, 'temp.ass')
const pipePath = '\\\\.\\pipe\\mpv_rasb'

export const generateDummyASS = (layers, previewStyle, text = 'Example text!!') => {
  const lines = layers.map((layer, i) => {
    const index = layers.length - i - 1
    const tags = generateTags(layer)

    return `Dialogue: ${index},0:00:00.00,0:00:01.00,Default,,0,0,0,,${tags}${text}\n`
  }).join('')

  return dummyASSHeader(previewStyle) + lines
}

/**
 * 
 * @param {*} layer : layer object
 * @param {*} padBorder : null, or a number indicating the maximum border width of all layers
 * @returns 
 */
const generateTags = (layer, padBorder = null) => {
  const {color, thickness, blur, opacity, offsetX, offsetY} = layer

  if (!(opacity >= 0 && opacity <= 255)) {
    throw new Error('invalid opacity: ' + opacity)
  }

  // for this workaround: https://twitter.com/sigh_of_boredom/status/1522082494606061568
  const prefix = padBorder ? `{\\bord${padBorder}}\u200d` : ''

  const opacityHex = (255 - opacity).toString(16).toUpperCase().padStart(2, '0')
  const colorTag = color === null ? '' : `\\4c${hexColorToASSColor(color)}`
  // shadow won't be rendered if xshad = yshad = 0
  const offsetDelta = (offsetX === 0 && offsetY === 0) ? 0.0001 : 0

  return `${prefix}{\\blur${blur}\\bord${thickness}\\3a&HFF&\\4a&H${opacityHex}&${colorTag}\\xshad${offsetX + offsetDelta}\\yshad${offsetY}}`
}

const hexColorToASSColor = (color) => {
  return `&H${color.slice(5, 7)}${color.slice(3, 5)}${color.slice(1, 3)}&`
}

const writeDummyASS = (layers, previewStyle, path) => {
  return promisify(fs.writeFile)(path, generateDummyASS(layers, previewStyle))
}

export const openPreviewInMPV = async (layers, previewStyle, mpvPath) => {
  const imgPath = path.resolve(__static, 'placeholder_bg.png')
  await writeDummyASS(layers, previewStyle, tempASSPath)
  const mpvProc = spawn(mpvPath, [
    imgPath,
    `--input-ipc-server=${pipePath}`,
    `--sub-file=${tempASSPath}`,
    '--no-config',
    '--keep-open=yes',
    '--geometry=600',
  ])
  // await events.once(mpvProc, 'spawn')  // spawn even not fired for some reason
  return mpvProc
}

export const previewStyleOnMpv = async (layers, previewStyle) => {
  await writeDummyASS(layers, previewStyle, tempASSPath)
  let pipe
  while (true) {
    try {
      pipe = fs.createWriteStream(pipePath, { encoding: 'utf-8' })
      await events.once(pipe, 'open')
      break
    } catch (error) {
      console.log('cannot open pipe')
      await sleep(1000)
    }
  }
  const message = {
    command: ['sub-reload'],
  }
  pipe.write(JSON.stringify(message) + '\n')
  await events.once(pipe, 'finish')
  pipe.close()
}

export const transformAssFile = async (inStream, outStream, layers, { targetStyles } = {}) => {
  const rl = readline.createInterface({
    input: inStream,
  })

  const writePromise = (data) => {
    if (outStream.write(data)) {
      return
    } else {
      return events.once(outStream, 'drain')
    }
  }

  const maxBorder = Math.max(...layers.map(layer => layer.thickness))
  const tagsForLayers = layers.map(layer => generateTags(layer, maxBorder))

  for await (const line of rl) {
    console.log('line read')
    const m = line.match(dialoguePattern)
    if (!m) {
      await writePromise(line + '\n')
      continue
    }

    const rest = m[1]
    const style = m[2]
    const text = m[3]

    if (targetStyles && !targetStyles.includes(style)) {
      await writePromise(line + '\n')
      continue
    }

    for (const [i, tags] of tagsForLayers.entries()) {
      const index = tagsForLayers.length - i - 1
      await writePromise(`Dialogue: ${index}${rest}${tags}${text}\n`)
    }
  }
}

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time)
  })
}
