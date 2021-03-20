const path = require('path')
const fs = require('fs')
const readline = require('readline')
const { execFile } = require('child_process')
const { promisify } = require('util')

const dummyASSHeader = `[Script Info]
Title: Default Aegisub file
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,150,&H00FEE951,&H000E0EBF,&H00FFFFFF,&H00FF0000,1,0,0,0,100,100,0,0,1,0,0,2,10,10,100,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

const dialoguePattern = /^Dialogue: [^,]+(,[^,]+,[^,]+,([^,]*),[^,]*,\d+,\d+,\d+,[^,]*,)(.*)$/

const tempASSPath = path.resolve(process.cwd(), 'temp.ass')
const pipePath = '\\\\.\\pipe\\mpv'

export const generateDummyASS = (layers, text = 'Example text!!') => {
  const lines = layers.map((layer, i) => {
    const index = layers.length - i - 1
    const tags = generateTags(layer)

    return `Dialogue: ${index},0:00:00.00,0:00:01.00,Default,,0,0,0,,${tags}${text}\n`
  }).join('')

  return dummyASSHeader + lines
}

const generateTags = (layer) => {
  const {color, thickness, blur, opacity, offsetX, offsetY} = layer

  if (!(opacity >= 0 && opacity <= 255)) {
    throw new Error('invalid opacity: ' + opacity)
  }

  const opacityHex = (255 - opacity).toString(16).toUpperCase().padStart(2, '0')
  const colorTag = color === null ? '' : `\\4c&H${color.slice(5, 7)}${color.slice(3, 5)}${color.slice(1, 3)}&`
  // shadow won't be rendered if xshad = yshad = 0
  const offsetDelta = (offsetX === 0 && offsetY === 0) ? 0.0001 : 0

  return `{\\blur${blur}\\bord${thickness}\\3a&HFF&\\4a&H${opacityHex}&${colorTag}\\xshad${offsetX + offsetDelta}\\yshad${offsetY}}`
}

const writeDummyASS = (layers, path) => {
  return promisify(fs.writeFile)(path, generateDummyASS(layers))
}

export const openMpvWindow = () => {
  const mpvPath = 'C:\\Users\\*****\\Documents\\APPS\\mpv-x86_64-20201220-git-dde0189\\mpv.exe' // TODO: replace this
  const imgPath = path.resolve(__dirname, 'assets/placeholder_bg.png')
  const mpvProc = execFile(mpvPath, [
    imgPath,
    `--input-ipc-server=${pipePath}`,
    `--sub-file=${tempASSPath}`,
    '--no-config',
    '--keep-open=yes',
    '--geometry=600',
  ])
  return mpvProc
}

export const previewStyleOnMpv = async (layers) => {
  await writeDummyASS(layers, tempASSPath)
  let pipe
  while (true) {
    try {
      pipe = fs.createWriteStream(pipePath, { encoding: 'utf-8' })
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
}

export const transformAssFile = async (inStream, outStream, layers, { targetStyles } = {}) => {
  const rl = readline.createInterface({
    input: inStream,
  })

  const tagsForLayers = layers.map(layer => generateTags(layer))

  for await (const line of rl) {
    console.log('line read')
    const m = line.match(dialoguePattern)
    if (!m) {
      outStream.write(line + '\n')
      continue
    }

    const rest = m[1]
    const style = m[2]
    const text = m[3]

    if (targetStyles && !targetStyles.includes(style)) {
      outStream.write(line + '\n')
      continue
    }

    tagsForLayers.forEach((tags, i) => {
      const index = tagsForLayers.length - i - 1
      outStream.write(`Dialogue: ${index}${rest}${tags}${text}\n`)
    })
  }
}

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), time)
  })
}
